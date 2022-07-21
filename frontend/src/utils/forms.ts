export const fieldProps = <T extends {[prop: string]: any, values: VS}, VS>(form: T, field: keyof VS) => ({
  name: field,
  value: form.values[field],
  onChange: form.handleChange,
  error: form.touched[field] && Boolean(form.errors[field]),
  helperText: form.touched[field] && form.errors[field]
})
