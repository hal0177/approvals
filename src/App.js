import { useState, useEffect } from "react"
import styled from "styled-components"
import GlobalStyle from "./globalStyle"
import Web3 from "web3"
import { ethers } from "ethers"

import ERC20_ABI from "./erc20Abi.mjs"

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  width: 600px;
  margin: 20px;
  font-size: 2rem;
  font-weight: bold;
`

const Button = styled.button`
  width: 100px;
  height: 50px;
  margin-left: 50px;
`

const Subtitle = styled.div`
  display: flex;
  width: 600px;
  margin: 20px;
  font-size: 1.4rem;
`

const Input = styled.input`
  width: 600px;
  height: 40px;
  margin-left: 20px;
`

const Confirm = styled.button`
  width: 610px;
  height: 75px;
  margin: 20px;
  font-size: 1rem;
`

function App() {
  const [ connection, setConnection ] = useState(null)
  const [ tx, setTx ] = useState("")
  const [ allowance, setAllowance ] = useState("")
  const [ newAllowance, setNewAllowance ] = useState(null)

  useEffect(() => {
    console.log(tx)
  }, [ tx ])

  useEffect(() => {
    console.log(allowance)
  }, [ allowance ])

  const connect = async () => {
    try {
      const provider = window.ethereum
      provider.enable()
      setConnection({ connected: true, web3: new Web3(provider) })
    } catch(err) {
      console.log(err.message)
    }
  }

  const setApprovalZero = async () => {
    let err
    if(!connection) err = "not connected"
    else if(tx.length !== 66) err = "invalid tx length"
    else if(!connection.web3.utils.isHexStrict(tx)) err = "invalid tx hex string"
    else if(allowance === "") err = "no allowance set"

    if(err) {
      console.log(err)
      return
    }

    const web3 = connection.web3
    const iface = new ethers.utils.Interface(ERC20_ABI)
    const transaction = await web3.eth.getTransaction(tx)
    const { input, value, from, to } = transaction
    const parsed = iface.parseTransaction({ data: input, value })
    const { spender, amount } = parsed.args

    const contract = new web3.eth.Contract(ERC20_ABI, to)

    try {
      await contract.methods.approve(spender, web3.utils.toWei(allowance, "ether")).send({ from: from })
    } catch(err) {
      console.log(`Failed approving ${ allowance }, ${ err.message }`)
    }

    try {
      const amount = web3.utils.fromWei(await contract.methods.allowance(from, spender).call())
      console.log(`New allowance: ${ amount }`)

      setNewAllowance({ spender, amount })
    } catch(err) {
      console.log(`Failed getting new allowance: ${ err.message }`)
    }

  }


  return (
    <AppContainer>
      <GlobalStyle/>
      <Title>
        Set Approvals to Zero
        <Button onClick={ connect }>Connect</Button>
      </Title>
      <Subtitle>
        Transaction Hash:
      </Subtitle>
      <Input type="text" value={ tx } onChange={ e => setTx(e.target.value) } />
      <Subtitle>
        New Allowance
      </Subtitle>
      <Input type="number" min="0" value={ allowance } onChange={ e => setAllowance(e.target.value) } />
      <Confirm onClick={ setApprovalZero }>
        Confirm
      </Confirm>
      <Subtitle>
        { newAllowance ? `Current allowance for ${ newAllowance.spender } is ${ newAllowance.amount }` : "" }
      </Subtitle>
    </AppContainer>
  );
}

export default App;
