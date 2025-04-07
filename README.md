# blockchain-economy-game

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### cloud functionsについて
実装は完了しているが、意図しない課金防止のためデプロイはしていない(デプロイできることは確認済み)
開発中にテストなどで使用する場合は

```
firebase deploy --only functions
```
上記でデプロイし、使用が終了したら
```
firebase functions:delete updateKuzelliumPrice updateGoldPrice startGame endGame advancePhase onNewUser onTradeComplete onMiningSuccess
```
で削除すること