use std::collections::HashMap;
use clap::{Args};

use serde::{Serialize};
use anyhow::{Result};
use serde_repr::*;

use std::path::PathBuf;
use tantivy::{doc, DocAddress, Document, Index};
use tantivy::aggregation::agg_req::{Aggregation, Aggregations, MetricAggregation};
use tantivy::aggregation::agg_result::{AggregationResult, MetricResult};
use tantivy::aggregation::AggregationCollector;
use tantivy::aggregation::metric::StatsAggregation;
use tantivy::collector::{Count, HistogramCollector, MultiCollector, TopDocs};
use tantivy::query::{PhraseQuery, Query, QueryParser, TermQuery};
use tantivy::schema::{Field, FieldType, IndexRecordOption, NamedFieldDocument};
use tantivy::tokenizer::{LowerCaser, NgramTokenizer, RemoveLongFilter, TextAnalyzer};
use crate::utils::query::{build_query, parse_query, QueryParams, register_tokenizers};

#[derive(Debug, Args)]
#[clap(args_conflicts_with_subcommands = true)]
pub struct Search {
    #[clap(short, long)]
    index: PathBuf,
    query: String,
    #[clap(short, long, default_value_t = 10)]
    limit: usize,
    #[clap(short, long, default_value_t = 0)]
    offset: usize,
    #[clap(long)]
    pos: Option<u64>,
    #[clap(long)]
    url: Option<bool>,
    #[clap(long)]
    min_count: Option<u64>,
    #[clap(long)]
    max_count: Option<u64>,
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
    agg: HashMap<String, AggResult>,
}

#[derive(Debug, Serialize)]
struct AggResult {
    min: f64,
    max: f64,
    mean: f64,
}

pub fn run(args: Search) -> Result<()> {
    let index = Index::open_in_dir(args.index)?;
    register_tokenizers(&index);

    let schema = index.schema();
    let reader = index.reader()?;
    let query = build_query(&index, &args.query, args.pos, args.url, args.min_count, args.max_count)?;
    // let query = parse_query(&index, &args.query)?;
    // dbg!(&query); // TODO: build the query ourselves and use slop parameter with %fuzziness

    let searcher = reader.searcher();

    let create_hit = |score: f64, doc: &Document, doc_address: DocAddress| -> Hit {
        Hit {
            score,
            doc: schema.to_named_doc(&doc),
            id: doc_address.doc_id,
        }
    };

    let mut multicollector = MultiCollector::new();

    let agg_req: Aggregations = vec![(
        "count_stats".to_string(),
        Aggregation::Metric(MetricAggregation::Stats(
            StatsAggregation::from_field_name("count".to_string()),
        )),
    )]
        .into_iter()
        .collect();
    let collector = AggregationCollector::from_aggs(agg_req);
    let agg_handle = multicollector.add_collector(collector);
    let top_docs_handle = multicollector.add_collector(
        TopDocs::with_limit(args.limit).and_offset(args.offset));
    let count_handle = multicollector.add_collector(Count);

    let mut multifruit = searcher.search(&query, &multicollector)?;

    let num_hits = count_handle.extract(&mut multifruit);
    let top_docs = top_docs_handle.extract(&mut multifruit);
    let hits: Vec<Hit> = top_docs
        .into_iter()
        .map(|(score, doc_address)| {
            let doc: Document = searcher.doc(doc_address.clone()).unwrap();
            create_hit(score as f64, &doc, doc_address)
        })
        .collect();

    let aggs = agg_handle.extract(&mut multifruit);
    let mut agg_values = HashMap::new();
    match &aggs.0["count_stats"] {
        AggregationResult::BucketResult(_) => {}
        AggregationResult::MetricResult(r) => match r {
            MetricResult::Average(_) => {}
            MetricResult::Stats(s) => {
                agg_values.insert("counts".to_string(), AggResult {
                    min: s.min.unwrap_or(0.0),
                    max: s.max.unwrap_or(0.0),
                    mean: s.avg.unwrap_or(0.0),
                });
            }
        }
    };

    let result = SearchResult {
        count: num_hits,
        hits,
        agg: agg_values,
    };

    println!("{}", serde_json::to_string_pretty(&result)?);
    Ok(())
}

