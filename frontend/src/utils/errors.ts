export const extractErrorMessage = (
  error: any,
  alt = 'Unknown error, please try again later'
) => {
  const message = error?.response?.data?.detail ?? error?.response?.data[0];

  return message
    ? `Error: ${message}`
    : alt;
}
