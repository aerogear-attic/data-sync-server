const puppeteer = require('puppeteer')

async function authenticateKeycloak (username, password) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage({args: ['--no-sandbox', '--disable-setuid-sandbox']})

  async function loginProcess () {
    await page.goto('http://localhost:8000/token')
    await page.type('input#username', username)
    await page.type('input#password', password)
    await page.click('input#kc-login')
  }

  const [authData] = await Promise.all([
    new Promise(resolve =>
      page.on('response', async response => {
        const url = response.request().url()
        if (url && url.includes('/token')) {
          try {
            const body = await response.text()
            resolve(JSON.parse(body))
          } catch (e) {
            // do nothing here, first call doesn't have JSON
          }
        }
      })
    ),
    loginProcess()
  ])

  await browser.close()
  return authData
}

module.exports = { authenticateKeycloak: authenticateKeycloak }
