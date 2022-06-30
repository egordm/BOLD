use clap::{Parser, Subcommand};
use crate::subcommands::build_index::BuildIndex;
use crate::subcommands::search::Search;

mod utils;
mod subcommands;

#[derive(Debug, Parser)]
#[clap(name = "bold")]
#[clap(about = "A collection of CLI tools for BOLD profiler", long_about = None)]
struct Cli {
    #[clap(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    #[clap(arg_required_else_help = true)]
    BuildIndex(BuildIndex),
    #[clap(arg_required_else_help = true)]
    Search(Search),
}


fn main() {
    let args = Cli::parse();

    match args.command {
        Commands::BuildIndex(sub) => {
            subcommands::build_index::run(sub).unwrap()
        }
        Commands::Search(sub) => {
            subcommands::search::run(sub).unwrap()
        }
    }
}