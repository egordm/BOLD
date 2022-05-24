use clap::{Args, Parser};

use serde::{Deserialize, Serialize};
use anyhow::{ensure, Result};
use serde_repr::*;

use std::path::PathBuf;
use tantivy::{doc, DocAddress, Document, Index, Score};
use tantivy::collector::{Count, TopDocs};
use tantivy::query::QueryParser;
use tantivy::schema::{Field, FieldType, INDEXED, NamedFieldDocument, Schema, STORED, TEXT};

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
}

#[derive(Debug, Serialize)]
struct Hit {
    score: Score,
    doc: NamedFieldDocument,
    id: u32,
}


pub fn run(args: Search) -> Result<()> {
    let index = Index::open_in_dir(args.index)?;

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
    let searcher = reader.searcher();


    let create_hit = |score: Score, doc: &Document, doc_address: DocAddress| -> Hit {
        Hit {
            score,
            doc: schema.to_named_doc(&doc),
            id: doc_address.doc_id,
        }
    };

    let (top_docs, num_hits) = {
        searcher.search(
            &query,
            &(TopDocs::with_limit(args.limit).and_offset(args.offset), Count),
        )?
    };
    let hits: Vec<Hit> = {
        top_docs
            .iter()
            .map(|(score, doc_address)| {
                let doc: Document = searcher.doc(*doc_address).unwrap();
                create_hit(*score, &doc, *doc_address)
            })
            .collect()
    };

    println!("{}", serde_json::to_string_pretty(&hits)?);

    Ok(())
}