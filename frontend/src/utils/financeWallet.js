const VISITOR_TAG_KEY = 'finance_wallet_visitor_tag'

export function getOrCreateVisitorTag() {
  let tag = localStorage.getItem(VISITOR_TAG_KEY)
  if (!tag) {
    tag = Math.random().toString(36).slice(2, 6).toUpperCase()
    localStorage.setItem(VISITOR_TAG_KEY, tag)
  }
  return tag
}

export function formatRupiah(amount) {
  return 'Rp' + Number(amount || 0).toLocaleString('id-ID')
}
