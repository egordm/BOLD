export const extractErrorMessage = (
  error: any,
  alt = 'Unknown error, please try again later'
) => {
  return error?.response?.data?.detail
    ? `Error: ${error?.response?.data?.detail}`
    : alt;
}
