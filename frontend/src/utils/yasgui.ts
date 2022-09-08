import { CellErrorOutput, CellOutput} from "../types/notebooks";


export const cellOutputToYasgui = (output: CellErrorOutput | CellOutput) => {
  if (output.output_type === 'execute_result') {
    const contentType = Object.keys(output.data)[0];
    const data = output.data[contentType];

    return {
      data, contentType,
      status: 200,
      executionTime: (output.execution_time ?? 0) * 1000,
    }
  } else if (output.output_type === 'error') {
    const error = [
      output.ename,
      output.evalue,
      output.traceback.join('\n'),
    ]

    return {
      status: 400,
      executionTime: (output.execution_time ?? 0) * 1000,
      error: {
        status: 400,
        text: error.join('\n\n'),
        statusText: errorToStatusText(output)
      }
    }
  } else {
    return {
      status: 400,
      executionTime: (output.execution_time ?? 0) * 1000,
      error: {
        status: 400,
        text: `Cant render output`,
        statusText: 'Cant render output'
      }
    }
  }
}

export const errorToStatusText = (error: CellErrorOutput) => {
  if (/Timeout/.test(`${error.ename} ${error.evalue}`)) {
    return 'Query timed out';
  }
  if (/Unbound/.test(`${error.ename} ${error.evalue}`)) {
    return 'Query references undefined variable';
  }
  if (/Malformed/.test(`${error.ename} ${error.evalue}`)) {
    return 'Malformed query';
  }
  if (/Syntax/.test(`${error.ename} ${error.evalue}`)) {
    return 'Query syntax error';
  }

  return 'Query failed';
}
