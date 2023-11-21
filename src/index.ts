import App from './carbon-credits/app'

const app = new App(`/mnt/input`, `/mnt/state`, `/mnt/output`)
// const app = new App(`${__dirname}/__test__/.input`, `${__dirname}/__test__/.state`, `${__dirname}/__test__/.output`)
app.run()
