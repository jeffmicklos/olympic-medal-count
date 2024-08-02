bsturd = {
  url: 'https://en.wikipedia.org/api/rest_v1/page/html/2024_Summer_Olympics_medal_table',

  medals() {
    return fetch(this.url)
      .then(response => {
        return response.text().then(t => this.htmlToJson(t))
      }).catch(e => {
        console.error(e.message)
        return null
      })
  },

  htmlToJson(html) {
    const parser = new DOMParser()
    const wikiDoc = parser.parseFromString(html, 'text/html')
    const parentElement = wikiDoc.getElementById('Medal_table').parentElement
    const jsonString = parentElement.querySelector('[data-mw-deduplicate]').dataset.mw
    const json = JSON.parse(jsonString || '{}')

    return this.extractMedalRanks(json?.parts[0]?.template.params)
  },

  extractMedalRanks(medals) {
    if (!medals) return {}

    const medalCount = this.extractMedal(medals)
    const allCountries = Object.keys(medalCount).reduce((acc, current) => {
      return [
        ...acc,
        { ...medalCount[current], country: current, total: this.mutiplyMedals(medalCount[current]) }
      ]
    }, [])

    return allCountries.sort((a, b) => b.total - a.total)
  },

  extractMedal: (medals) => {
    const regexp = new RegExp('^(gold|silver|bronze)', 'gi')
    return Object.keys(medals).reduce((acc, val) => {
      if (val.match(regexp)) {
        const [medal, country] = val.split('_')
        return { 
          ...acc,
          [country]: { ...acc[country], [medal]: Number(medals[val].wt) }
        }
      }

      return acc
    }, {})
  },

  mutiplyMedals({ gold, silver, bronze}) {
    const g = gold * 4
    const s = silver * 2

    return g + s + bronze
  }
}

bsturd.getFlagEmoji = countryCode => {
  const codePoints = window.COUNTRIES[countryCode]
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt())
  return String.fromCodePoint(...codePoints)
}

bsturd.paint = medals => {
  const first = medals[0]
  const topTen = medals.slice(0, 10)
  const body = document.body

  Object.keys(first).forEach(item => {
    if (body.querySelector(`[data-text="${item}"]`)) {
      if (item === 'country') {
        body.querySelector(`[data-text="${item}"]`).textContent = bsturd.getFlagEmoji(first[item])
      } else {
        body.querySelector(`[data-text="${item}"]`).textContent = first[item]
      }
    }
  })

  topTen.forEach(item => {
    const li = document.createElement('li')
    const div = document.createElement('div')
    li.textContent = `${bsturd.getFlagEmoji(item.country)} ${item.total}`
    div.innerHTML = `<b>${item.country}</b> Gold: ${item.gold}; Silver: ${item.silver}; Bronze: ${item.bronze}`
    li.append(div)
    body.querySelector('ol').append(li)
  })
}

bsturd.addMetaTags = medal => {
  const numImages = 6
  const image = Math.floor(Math.random() * numImages) + 1
  const imageSrc = `https://s3.amazonaws.com/media.sturd.online/olympics/${image}.webp`
  const metaData = [
    { name: 'og:description', content: `Gold: ${medal.gold}, Silver: ${medal.silver}, Bronze: ${medal.bronze}` },
    { name: 'description', content: `Gold: ${medal.gold}, Silver: ${medal.silver}, Bronze: ${medal.bronze}` },
    { name: 'og:image', content: imageSrc },
    { name: 'og:title', content: `${bsturd.getFlagEmoji(medal.country)} is the top Olympic country` },
  ]

  document.head.querySelector('title').textContent = `${bsturd.getFlagEmoji(medal.country)} is the top Olympic country`;
  metaData.forEach(meta => {
    const metaTag = document.createElement('meta')
    metaTag.setAttribute('name', meta.name)
    metaTag.setAttribute('content', meta.content)
    document.head.appendChild(metaTag)
  })
}
