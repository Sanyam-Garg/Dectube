import React, { Component } from 'react';
import DVideo from '../abis/DVideo.json'
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    //Load accounts
    const accounts = await web3.eth.getAccounts()
    this.setState({account: accounts[0]})
    //Add first account the the state

    //Get network ID
    const networkID = await web3.eth.net.getId()
    const networkData = DVideo.networks[networkID]
    if(networkData){
      const dvideo = new web3.eth.Contract(DVideo.abi, networkData.address)
      this.setState({dvideo})

      const videoCount = await dvideo.methods.videoCount().call()
      this.setState({videoCount})

      // Load videos, newest first
      for(var i = videoCount; i >= 1; i--){
        const video = await dvideo.methods.videos(i).call()
        this.setState({
          videos: [...this.state.videos, video]
        })
      }

      // Set latest video with title as default
      const latestVideo = await dvideo.methods.videos(videoCount).call()
      this.setState({
        currentHash: latestVideo.videoHash,
        currentTitle: latestVideo.title,
      })
      this.setState({loading: false})

    } else{
      window.alert('DVideo contract not deployed to detected network')
    }
    
      
      //Assign dvideo contract to a variable
      //Add dvideo to the state

      //Check videoAmounts
      //Add videAmounts to the state

      //Iterate throught videos and add them to the state (by newest)


      //Set latest video and it's title to view as default 
      //Set loading state to false

      //If network data doesn't exisits, log error
  }

  //Get video
  captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({buffer: Buffer(reader.result)})
    }
  }

  //Upload video
  uploadVideo = title => {
    console.log('Submitting file to IPFS')

    // Add the file to IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('IPFS result', result)
      if(error){
        console.log(error)
        return
      }
      // Put hash on blockchain
      this.setState({loading: true})
      // Have to use send when writing data
      this.state.dvideo.methods.uploadVideo(result[0].hash, title).send({from: this.state.account}).on('transactionHash', (hash) => {this.setState({loading: false})})

    })
  }

  //Change Video
  changeVideo = (hash, title) => {
    this.setState({
      currentHash: hash,
      currentTitle: title
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      dvideo: null,
      videos: [],
      loading: true,
      currentHash: null,
      currentTitle: null,
    }

    //Bind functions
  }

  render() {
    return (
      <div>
        <Navbar
          account={this.state.account}
        />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              captureFile={this.captureFile}
              uploadVideo={this.uploadVideo}
              currentHash={this.state.currentHash}
              currentTitle={this.state.currentTitle}
              videos={this.state.videos}
              changeVideo={this.state.changeVideo}
            />
        }
      </div>
    );
  }
}

export default App;