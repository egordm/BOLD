use clap::{Args};

use serde::{Serialize};
use anyhow::{Result};
use serde_repr::*;

use std::path::PathBuf;
use tantivy::{doc, DocAddress, Document, Index};
use tantivy::collector::{Count, MultiCollector, TopDocs};
use tantivy::query::{QueryParser};
use tantivy::schema::{Field, FieldType, NamedFieldDocument};
use tantivy::tokenizer::{LowerCaser, NgramTokenizer, RemoveLongFilter, TextAnalyzer};

#[derive(Debug, Args)]
#[clap(args_conflicts_with_subcommands = true)]
pub struct Search {
    query: String,
    #[clap(short, long)]
    index: PathBuf,
    #[clap(short, long, default_value_t = 10)]
    limit: usize,
    #[clap(short, long, default_value_t = 0)]
    offset: usize,
    #[clap(long)]
    order_by: Option<String>,
}

#[derive(Debug, Serialize)]
struct Hit {
    score: f64,
    doc: NamedFieldDocument,
    id: u32,
}

#[derive(Debug, Serialize)]
struct SearchResult {
    count: usize,
    hits: Vec<Hit>,
}

pub fn run(args: Search) -> Result<()> {
    let index = Index::open_in_dir(args.index)?;

    let ngram_tokenizer = TextAnalyzer::from(NgramTokenizer::new(3, 3, false))
        .filter(RemoveLongFilter::limit(40))
        .filter(LowerCaser);

    index
        .tokenizers()
        .register("ngram", ngram_tokenizer);

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
    let reader = index.reader()?;

    let query = query_parser.parse_query(&args.query)?;
    // dbg!(&query); TODO: build the query ourselves and use slop parameter with %fuzziness

    let searcher = reader.searcher();

    let create_hit = |score: f64, doc: &Document, doc_address: DocAddress| -> Hit {
        Hit {
            score,
            doc: schema.to_named_doc(&doc),
            id: doc_address.doc_id,
        }
    };

    let mut multicollector = MultiCollector::new();
    let count_handle = multicollector.add_collector(Count);

    let options = TopDocs::with_limit(args.limit).and_offset(args.offset);
    let (mut multifruit, top_docs) = {
        if let Some(order_by) = args.order_by {
            let field = schema.get_field(&order_by).expect("Order field must exist");
            let collector = options.order_by_u64_field(field);
            let top_docs_handle = multicollector.add_collector(collector);
            // let mut ret = searcher.search(&query, &multicollector)?;
            let mut ret = searcher.search(&query, &multicollector)?;

            let top_docs = top_docs_handle.extract(&mut ret);
            let result: Vec<(f64, DocAddress)> = top_docs
                .into_iter()
                .map(|(f, d)| {
                    (f as f64, DocAddress::from(d))
                })
                .collect();
            (ret, result)
        } else {
            let collector = options;
            let top_docs_handle = multicollector.add_collector(collector);
            let mut ret = searcher.search(&query, &multicollector)?;

            let top_docs = top_docs_handle.extract(&mut ret);
            let result: Vec<(f64, DocAddress)> = top_docs
                .into_iter()
                .map(|(f, d)| {
                    (f as f64, DocAddress::from(d))
                })
                .collect();
            (ret, result)
        }
    };

    let num_hits = count_handle.extract(&mut multifruit);


    // let (top_docs, num_hits) = searcher.search(&query, &multicollector)?;

    let hits: Vec<Hit> = {
        top_docs
            .into_iter()
            .map(|(score, doc_address)| {
                let doc: Document = searcher.doc(doc_address.clone()).unwrap();
                create_hit(score, &doc, doc_address)
            })
            .collect()
    };

    let result = SearchResult {
        count: num_hits,
        hits,
    };

    println!("{}", serde_json::to_string_pretty(&result)?);
    Ok(())
}