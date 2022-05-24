use clap::{Args, Parser};

use serde::Deserialize;
use anyhow::{ensure, Result};
use serde_repr::*;

use std::path::PathBuf;
use tantivy::{doc, Index};
use tantivy::schema::{INDEXED, Schema, STORED, TEXT};

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
    if args.force {
        println!("Deleting old index directory");
        std::fs::remove_dir_all(&args.index_dir)?;
    }

    ensure!(!args.index_dir.exists(), "Index directory already exists!");
    std::fs::create_dir_all(&args.index_dir)?;

    let mut schema_builder = Schema::builder();
    let iri = schema_builder.add_text_field("iri", TEXT | STORED);
    let label = schema_builder.add_text_field("label", TEXT);
    let count = schema_builder.add_u64_field("count", INDEXED | STORED);
    let pos = schema_builder.add_u64_field("pos", INDEXED | STORED);
    let ty = schema_builder.add_text_field("ty", TEXT | STORED);

    let schema = schema_builder.build();
    let index = Index::create_in_dir(args.index_dir, schema.clone())?;

    let mut index_writer = index.writer(50_000_000).unwrap();

    let mut rdr = csv::ReaderBuilder::new()
        .delimiter(b'\t')
        .has_headers(true)
        .from_path(args.input)?;

    let mut cursor = 0;
    let mut success_count = 0;
    let mut error_count = 0;
    for result in rdr.deserialize::<Record>() {
        match result {
            Ok(record) => {
                index_writer.add_document(doc!(
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