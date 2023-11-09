import { BigNumber, ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [weiAmount, setWeiAmount] = useState();
  const [etherAmount, setEtherAmount] = useState();

  useEffect(() => {
    async function getAccounts() {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      const startOfAddress = accounts[0].slice(0, 6);
      const endOfAddress = accounts[0].slice(-5);
      const finalAddressFormat = startOfAddress.concat('...', endOfAddress);

      setAccount(finalAddressFormat);
      setSigner(provider.getSigner());
    }

    getAccounts();
  }, [account]);

  useEffect(() => {
    function etherToWeiConverter() {
      setWeiAmount(etherAmount * 10 ** 18);
    }
    etherToWeiConverter();
  }, [etherAmount]);

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = ethers.BigNumber.from(document.getElementById('wei').value);
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value.toString(),
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
          document.getElementById(escrowContract.address).className = 'complete';
          document.getElementById(escrowContract.address).innerText = "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };

    setEscrows([...escrows, escrow]);
  }

  return (
    <div className="container">
      <div className="first-column">
        <div className="contract">
          <h1>New Escrow Contract</h1>

          <div className="depositer-address">DEPOSITER ADDRESS: {account}</div>

          <div className="instructions-list">
            <p>To change depositer address:</p>
            <ol>
              <li>Open your wallet</li>
              <li>Change to desired address (be sure this address is already connected to d'App)</li>
              <li>Refresh the page and check the depositer address has changed to the new address</li>
            </ol>
          </div>

          <div className="contract-inputs">
            <label>
              Arbiter Address
              <input type="text" id="arbiter" />
            </label>

            <label>
              Beneficiary Address
              <input type="text" id="beneficiary" />
            </label>

            <label>
              Deposit Amount (in Wei)
              <input type="text" id="wei" />
            </label>
          </div>

          <div
            className="button"
            id="deploy"
            onClick={(e) => {
              e.preventDefault();
              newContract();
            }}
          >
            Deploy
          </div>
        </div>
      </div>

      <div className="second-column">
        <div className="existing-contracts">
          <h1> Existing Contracts </h1>

          <div>
            {escrows.map((escrow) => {
              return <Escrow key={escrow.address} {...escrow} />;
            })}
          </div>
        </div>

        <div className="converter">
          <h1> Ether Unit Converter </h1>

          <label>
            Ether Value
            <input type="text" id="ether-amount" value={etherAmount} onChange={(e) => setEtherAmount(e.target.value)} />
          </label>

          <h4>WEI VALUE: {weiAmount}</h4>
        </div>
      </div>
    </div>
  );
}

export default App;
