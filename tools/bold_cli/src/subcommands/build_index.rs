use clap::{Args, Parser};

use serde::Deserialize;
use anyhow::{ensure, Result};
use serde_repr::*;

use std::path::PathBuf;
use fancy_regex::{Captures, Regex};
use tantivy::{doc, Index};
use tantivy::schema::{FAST, INDEXED, IndexRecordOption, Schema, STORED, TEXT, TextFieldIndexing, TextOptions};
use tantivy::tokenizer::{LowerCaser, NgramTokenizer, RemoveLongFilter, TextAnalyzer};
use url::Url;

#[derive(Debug, Args)]
#[clap(args_conflicts_with_subcommands = true)]
pub struct BuildIndex {
    input: PathBuf,
    index_dir: PathBuf,
    #[clap(short, long)]
    force: bool,
    #[clap(short, long, default_value_t = 5000)]
    commit_frequency: u64,
}

#[derive(Debug, Deserialize)]
struct Record {
    #[serde(rename = "?iri")]
    iri: String,
    #[serde(rename = "?label")]
    label: String,
    #[serde(rename = "?count")]
    count: i64,
    #[serde(rename = "?pos")]
    pos: PosType,
    #[serde(rename = "?type")]
    ty: String,

}

#[derive(Debug, Deserialize_repr)]
#[repr(u8)]
enum PosType {
    #[serde(rename = "subject")]
    Subject = 0,
    #[serde(rename = "property")]
    Property = 1,
    #[serde(rename = "value")]
    Value = 2,
}


pub fn run(args: BuildIndex) -> Result<()> {
    if args.force && args.index_dir.exists() {
        println!("Deleting old index directory");
        std::fs::remove_dir_all(&args.index_dir)?;
    }

    ensure!(!args.index_dir.exists(), "Index directory already exists!");
    std::fs::create_dir_all(&args.index_dir)?;

    let natural_text_indexing = TextFieldIndexing::default()
        .set_tokenizer("ngram")
        .set_index_option(IndexRecordOption::WithFreqsAndPositions);

    let natural_text_options = TextOptions::default()
        .set_indexing_options(natural_text_indexing)
        .set_stored();


    let mut schema_builder = Schema::builder();
    let iri_text = schema_builder.add_text_field("iri_text", natural_text_options.clone());
    let iri = schema_builder.add_text_field("iri", TEXT | STORED);
    let label = schema_builder.add_text_field("label", natural_text_options.clone());
    let count = schema_builder.add_u64_field("count", INDEXED | STORED | FAST);
    let pos = schema_builder.add_u64_field("pos", INDEXED | STORED | FAST);
    let ty = schema_builder.add_text_field("ty", TEXT | STORED);
    let schema = schema_builder.build();

    let index = Index::create_in_dir(args.index_dir, schema.clone())?;

    let ngram_tokenizer = TextAnalyzer::from(NgramTokenizer::new(2, 8, false))
        .filter(RemoveLongFilter::limit(40))
        .filter(LowerCaser);

    index
        .tokenizers()
        .register("ngram", ngram_tokenizer);

    let mut index_writer = index.writer(50_000_000).unwrap();

    let mut rdr = csv::ReaderBuilder::new()
        .delimiter(b'\t')
        .has_headers(true)
        .from_path(args.input)?;

    let re_upper = Regex::new(r"(?<![A-Z])([A-Z])").unwrap();
    let re_special = Regex::new(r"([-_#])").unwrap();

    let mut cursor = 0;
    let mut success_count = 0;
    let mut error_count = 0;
    for result in rdr.deserialize::<Record>() {
        match result {
            Ok(record) => {
                let text = if record.iri.trim_start_matches("<").starts_with("http") {
                    Url::parse(&record.iri.trim_start_matches("<").trim_end_matches(">")).ok()
                        .and_then(|url| url.path_segments().and_then(|ss| ss.last().map(|s| s.to_string())))
                        .unwrap_or("".to_string())
                } else {
                    record.iri.clone()
                };

                let text = re_special.replace_all(&text, " ");
                let text = re_upper.replace_all(&text, |caps: &Captures| {
                    format!(" {}", &caps[1])
                }).to_string();

                index_writer.add_document(doc!(
                    iri_text => text,
                    iri => record.iri,
                    label => record.label,
                    count => record.count as u64,
                    pos => record.pos as u64,
                    ty => record.ty,
                ))?;
                success_count += 1;
            },
            Err(e) => {
                error_count += 1;
                println!("Error occured at document {}: {}", cursor, e);
            }
        }

        cursor += 1;
        if cursor % args.commit_frequency == 0 {
            println!("Committing at {}", cursor);
        }
    }

    index_writer.commit()?;
    println!("Created index with {} documents", success_count);
    Ok(())
}