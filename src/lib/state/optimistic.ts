export async function runOptimistic<T>({
  apply,
  rollback,
  action,
}: {
  apply: () => void
  rollback: () => void
  action: () => Promise<T>
}): Promise<T> {
  apply()
  try {
    return await action()
  } catch (err) {
    rollback()
    throw err
  }
}
