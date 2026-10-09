export async function shareBalance(
  balance: number,
  rank: number | null
): Promise<'shared' | 'copied' | 'cancelled'> {
  const rankText = rank !== null && rank <= 10 ? ` I'm #${rank} on the leaderboard.` : ''
  const message = `I'm sitting on $${balance.toLocaleString()} on Stacks.${rankText} Can you beat me? https://stacksgame.app`

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: message })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  await navigator.clipboard.writeText(message)
  return 'copied'
}