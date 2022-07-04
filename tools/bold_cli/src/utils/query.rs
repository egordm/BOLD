use tantivy::{Index, Term};
use tantivy::query::{BooleanQuery, FuzzyTermQuery, Occur, PhraseQuery, Query, QueryParser, QueryParserError, RangeQuery, TermQuery};
use tantivy::schema::{Field, FieldType, IndexRecordOption};
use anyhow::{anyhow, Result};
use clap::arg_enum;
use clap::{Args};
use tantivy::tokenizer::{LowerCaser, NgramTokenizer, RemoveLongFilter, SimpleTokenizer, TextAnalyzer, Tokenizer};

pub fn register_tokenizers(index: &Index) {
    let ngram_tokenizer = TextAnalyzer::from(NgramTokenizer::new(3, 3, false))
        .filter(RemoveLongFilter::limit(40))
        .filter(LowerCaser);
    index
        .tokenizers()
        .register("ngram", ngram_tokenizer);
}

#[derive(Debug)]
pub struct QueryParams {
    pub query: String,
    pub limit: usize,
    pub offset: usize,
    pub pos: Option<u64>,
    pub url: Option<bool>,
    pub min_count: Option<u64>,
    pub max_count: Option<u64>,
}

pub fn build_phrase_query(index: &Index, field: Field, query: &str, slop: u32) -> Option<Box<dyn Query>> {
    let tokenizer = index.tokenizer_for_field(field).ok()?;
    let mut token_stream = tokenizer.token_stream(query);
    let mut terms = Vec::new();
    while let Some(token) = token_stream.next() {
        terms.push((0, Term::from_field_text(field, &token.text)))
    }
    if terms.len() == 0 {
        return None;
    } else if terms.len() == 1 {
        Some(Box::new(TermQuery::new(
            terms[0].1.clone(), IndexRecordOption::Basic,
        )))
    } else {
        let mut phrase_query = PhraseQuery::new_with_offset(terms);
        phrase_query.set_slop(slop);
        Some(Box::new(phrase_query))
    }
}


pub fn build_query(
    index: &Index, query: &str, pos: Option<u64>, url: Option<bool>,
    min_count: Option<u64>, max_count: Option<u64>,
) -> Result<Box<dyn Query>> {
    let query = query.trim().to_lowercase();
    let schema = index.schema();

    let get_field = |field_name: &str| -> Result<Field> {
        let field = schema.get_field(field_name).ok_or_else(|| anyhow!("Field {} not found", field_name))?;
        Ok(field)
    };

    let mut queries: Vec<(Occur, Box<dyn Query>)> = Vec::new();
    if let Some(pos) = pos {
        queries.push((Occur::Must, Box::new(TermQuery::new(
            Term::from_field_u64(get_field("pos")?, pos as u64),
            IndexRecordOption::Basic,
        ))))
    }

    if let Some(url) = url {
        queries.push((Occur::Must, Box::new(TermQuery::new(
            Term::from_field_u64(get_field("is_url")?, url as u64),
            IndexRecordOption::Basic,
        ))))
    }

    if min_count.is_some() || max_count.is_some() {
        let range = match (min_count, max_count) {
            (Some(min), Some(max)) => min..max,
            (Some(min), None) => min..u64::MAX,
            (None, Some(max)) => 0..max,
            (None, None) => 0..u64::MAX,
        };
        queries.push((
            Occur::Must,
            Box::new(RangeQuery::new_u64(get_field("count")?, range)),
        ));
    }

    let word_query = |word: &str| -> Result<Box<BooleanQuery>> {
        let mut subqueries: Vec<(Occur, Box<dyn Query>)> = Vec::new();

        subqueries.push((
            Occur::Should,
            Box::new(FuzzyTermQuery::new(
                Term::from_field_text(get_field("iri")?, word),
                1, true
            )),
        ));
        subqueries.push((
            Occur::Should,
            Box::new(FuzzyTermQuery::new(
                Term::from_field_text(get_field("ty")?, word),
                1, true
            )),
        ));

        if let Some(phrase_query) = build_phrase_query(index, get_field("iri_text")?, word, 1) {
            subqueries.push((Occur::Should, phrase_query));
        }
        if let Some(phrase_query) = build_phrase_query(index, get_field("label")?, word, 1) {
            subqueries.push((Occur::Should, phrase_query));
        }

        Ok(Box::new(BooleanQuery::new(subqueries)))
    };

    let mut word_queries: Vec<(Occur, Box<dyn Query>)> = Vec::new();
    let tokenizer = SimpleTokenizer;
    let mut token_stream = tokenizer.token_stream(&query);
    while let Some(token) = token_stream.next() {
        word_queries.push((Occur::Should, word_query(&token.text)?));
    }
    queries.push((
        Occur::Must,
        Box::new(BooleanQuery::new(word_queries))
    ));


    Ok(Box::new(BooleanQuery::new(queries)))
}

pub fn parse_query(index: &Index, query: &str) -> Result<Box<dyn Query>, QueryParserError> {
    let schema = index.schema();
    let default_fields: Vec<Field> = schema
        .fields()
        .filter(|&(_, field_entry)| match field_entry.field_type() {
            FieldType::Str(ref text_field_options) => {
                text_field_options.get_indexing_options().is_some()
            }
            _ => false,
        })
        .map(|(field, _)| field)
        .collect();
    let query_parser = QueryParser::new(schema.clone(), default_fields, index.tokenizers().clone());

    query_parser.parse_query(query)
}