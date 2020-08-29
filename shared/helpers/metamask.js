import reducers from 'redux/core/reducers'
import { getState } from 'redux/core'
import actions from 'redux/actions'
import { cacheStorageGet, cacheStorageSet } from 'helpers'
import web3 from 'helpers/web3'
import { setMetamask, setDefaultProvider } from 'helpers/web3'


const metamaskProvider = (window.ethereum) || false

const isEnabled = () => !(!metamaskProvider)

const isConnected = () => metamaskProvider && metamaskProvider.selectedAddress

const getAddress = () => (isConnected()) ? metamaskProvider.selectedAddress : ''

const addWallet = () => {
  _initReduxState()
  if (isEnabled() && isConnected()) {
    getBalance()
  }
}

const getBalance = () => {
  const { user: { metamaskData } } = getState()
  if (metamaskData) {
    const { address } = metamaskData

    const balanceInCache = cacheStorageGet('currencyBalances', `eth_${address}`)
    if (balanceInCache !== false) return balanceInCache

    return web3.eth.getBalance(address)
      .then(result => {
        const amount = web3.utils.fromWei(result)

        cacheStorageSet('currencyBalances', `eth_${address}`, amount, 30)
        reducers.user.setBalance({ name: 'metamaskData', amount })
        return amount
      })
      .catch((e) => {
        reducers.user.setBalanceError({ name: 'metamaskData' })
      })
  }
}

const connect = () => new Promise(async (resolved, reject) => {
  if (metamaskProvider
      && metamaskProvider.enable
  ) {
    await metamaskProvider.enable()
    setTimeout(() => {
      if (getAddress()) {
        resolved(true)
        addWallet()
        setMetamask(metamaskProvider)
      } else {
        setDefaultProvider()
        reject(`timeout`)
      }
    }, 1000)
  } else {
    setDefaultProvider()
    reject(`metamask not enabled`)
  }
})

const _initReduxState = () => {
  const {
    user: {
      ethData,
    },
  } = getState()

  if (isEnabled() && isConnected()) {
    reducers.user.addWallet({
      name: 'metamaskData',
      data: {
        address: getAddress(),
        balance: 0,
        balanceError: false,
        isConnected: true,
        isMetamask: true,
        currency: "ETH",
        fullName: "Ethereum (Metamask)",
        infoAboutCurrency: ethData.infoAboutCurrency,
        isBalanceFetched: true,
        isMnemonic: true,
        unconfirmedBalance: 0,
      },
    })
  } else {
    if (isEnabled()) {
      reducers.user.addWallet({
        name: 'metamaskData',
        data: {
          address: 'Not connected',
          balance: 0,
          balanceError: false,
          isConnected: false,
          isMetamask: true,
          currency: "ETH",
          fullName: "Ethereum (Metamask)",
          infoAboutCurrency: ethData.infoAboutCurrency,
          isBalanceFetched: true,
          isMnemonic: true,
          unconfirmedBalance: 0,
        }
      })
    } else {
      reducers.user.addWallet({
        name: 'metamaskData',
        data: false,
      })
    }
  }
}

_initReduxState()
if (isEnabled() && isConnected()) {
  setMetamask(metamaskProvider)
}

const metamaskApi = {
  connect,
  isEnabled,
  isConnected,
  getAddress,
  metamaskProvider,
  addWallet,
  getBalance,
}


window.metamaskApi = metamaskApi

export default metamaskApi
