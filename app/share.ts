export async function shareBalance(
  balance: number,
  rank: number | null
): Promise<'shared' | 'copied' | 'cancelled'> {
  const rankText = rank !== null && rank <= 10 ? ` I'm #${rank} on the leaderboard.` : ''
  const text = `I'm sitting on $${balance.toLocaleString()} on Stacks.${rankText} Can you beat me?`
  const url = 'https://stacksgame.app'

  if ('share' in navigator) {
    try {
      await navigator.share({ text, url })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  await navigator.clipboard.writeText(`${text} ${url}`)
  return 'copied'
}