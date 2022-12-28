const ggSearch = () => {
  const urlElems = document.querySelectorAll("a[href*='wikipedia.org']")
  for (let elem of urlElems) {
    let link = elem as HTMLLinkElement
    let url = link.href
    let host = new URL(url).host

    if (!host.endsWith("wikipedia.org")) {
      continue
    }

    let key = url.substring(url.lastIndexOf("/") + 1)
    link.href = `https://zh.wikipedia.org/zh-cn/${key}`
  }
}

ggSearch()

export {}