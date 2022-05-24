use std::ffi::OsString;
use std::path::PathBuf;

use clap::{Args, Parser, Subcommand};
use crate::subcommands::build_index::BuildIndex;

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
}


fn main() {
    let args = Cli::parse();

    match args.command {
        Commands::BuildIndex(sub) => {
            subcommands::build_index::run(sub).unwrap()
        }
    }
}