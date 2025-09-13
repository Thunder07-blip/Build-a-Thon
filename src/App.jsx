import React, { useState, useEffect } from 'react'; // Add useState and useEffect
import { ethers } from 'ethers'; // Import ethers library

import './App.css';

// --- Smart Contract ABIs (***REPLACE THESE WITH ABIs FROM REMIX AFTER COMPILATION***) ---
const VERIFICATION_REGISTRY_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_ngo",
				"type": "address"
			}
		],
		"name": "authorizeNGO",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "ngo",
				"type": "address"
			}
		],
		"name": "NGOAuthorized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "refugee",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "ngo",
				"type": "address"
			}
		],
		"name": "RefugeeVerified",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_refugee",
				"type": "address"
			}
		],
		"name": "verifyRefugee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_refugee",
				"type": "address"
			}
		],
		"name": "getVerificationStatus",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isNGO",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isVerified",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];


const DONATION_POOL_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_verificationRegistryAddress",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "refugee",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "AidDistributed",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_refugee",
				"type": "address"
			}
		],
		"name": "distributeAid",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "donate",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "donor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "DonationReceived",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_newAmount",
				"type": "uint256"
			}
		],
		"name": "setMinAidAmount",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "getContractBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "minAidAmount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "verificationRegistry",
		"outputs": [
			{
				"internalType": "contract VerificationRegistry",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// --- Smart Contract Addresses (***REPLACE THESE WITH YOUR DEPLOYED CONTRACT ADDRESSES FROM REMIX***) ---
const VERIFICATION_REGISTRY_ADDRESS = "0x26a3ea9E99c36A4691E0531280FB64b1333132a1"; // Example
const DONATION_POOL_ADDRESS = "0x035DaC3212656F0358c15743587eEbBE67d9Fab7"; // Example

// ... (rest of the App.js code is exactly the same) ...

function App() {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState('');
    const [verificationRegistryContract, setVerificationRegistryContract] = useState(null);
    const [donationPoolContract, setDonationPoolContract] = useState(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [refugeeAddress, setRefugeeAddress] = useState('');
    const [isRefugeeVerified, setIsRefugeeVerified] = useState(false);
    const [contractBalance, setContractBalance] = useState('0');
    const [statusMessage, setStatusMessage] = useState('');

// This useEffect hook is for setting up initial data load and event listeners.
// It will run only ONCE when the component first mounts.
useEffect(() => {
    // A function to get blockchain data that is called by the listener
    const getBlockchainData = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                setProvider(provider);
                
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    const accountAddress = accounts[0];
                    setAccount(accountAddress);

                    const signer = await provider.getSigner();
                    setSigner(signer);
                    
                    const verificationRegistry = new ethers.Contract(VERIFICATION_REGISTRY_ADDRESS, VERIFICATION_REGISTRY_ABI, signer);
                    setVerificationRegistryContract(verificationRegistry);

                    const donationPool = new ethers.Contract(DONATION_POOL_ADDRESS, DONATION_POOL_ABI, signer);
                    setDonationPoolContract(donationPool);

                    setStatusMessage('Wallet connected successfully!');
                }
            } catch (error) {
                console.error("Connection failed:", error);
                setStatusMessage("Please connect to MetaMask to use the app.");
                setAccount('');
            }
        } else {
            setStatusMessage("MetaMask not detected. Please install it.");
        }
    };
    
    // Call the function once on initial load
    getBlockchainData();

    // Set up the event listener for when accounts change
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', getBlockchainData);
    }
    
    // Clean up the event listener when the component unmounts
    return () => {
        if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', getBlockchainData);
        }
    };
}, []); // The empty array ensures this effect runs only ONCE


    useEffect(() => {
        loadBlockchainData();
    }, [account]);

    useEffect(() => {
  // This effect will run whenever verificationRegistryContract is set to a non-null value
  if (verificationRegistryContract && account) {
    checkRefugeeVerification(account);
  }
}, [verificationRegistryContract, account]);

// ... (your state variables) ...

const loadBlockchainData = async () => {
    if (window.ethereum) { // Check if MetaMask is installed and available
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider); // Save the provider instance

        try {
            // Request access to user's accounts
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log("Connected accounts:", accounts);
            setAccount(accounts[0]); // Set the first connected account as our active account
            const signer = await provider.getSigner(); // Get a signer object for sending transactions
            setSigner(signer); // Save the signer instance
            console.log("Signer:", signer); 

            const signerAddress = await signer.getAddress();
            console.log("Signer address:", await signer.getAddress());

            // Initialize VerificationRegistry contract instance
            const verificationRegistry = new ethers.Contract(
                VERIFICATION_REGISTRY_ADDRESS,
                VERIFICATION_REGISTRY_ABI,
                signer // Pass the signer to enable sending transactions
            );
            setVerificationRegistryContract(verificationRegistry); // Save the contract instance

            // Initialize DonationPool contract instance
            const donationPool = new ethers.Contract(
                DONATION_POOL_ADDRESS,
                DONATION_POOL_ABI,
                signer // Pass the signer to enable sending transactions
            );
            setDonationPoolContract(donationPool); // Save the contract instance

            // After connection, update initial UI data if an account is present
            if (accounts[0]) {
                // We'll define these functions later in Task 2 & 3
                // For now, these lines will just be here, uncomment them as you implement
                 //await checkRefugeeVerification(accounts[0]);
                 await fetchContractBalance();
            }

            setStatusMessage('Wallet connected successfully!'); // User feedback

            // --- Event Listeners (Paste these now, they will be used by all tasks) ---
            // These will automatically update the UI when contract events are emitted
            verificationRegistry.on("RefugeeVerified", (refugee, ngo) => {
                console.log(`Refugee Verified: ${refugee} by NGO: ${ngo}`);
                setStatusMessage(`Refugee ${refugee.substring(0, 6)}... verified!`);
                // This function will be implemented in Hour 4, but the listener is ready
                // simulateAIDistribution(refugee);
            });
            donationPool.on("DonationReceived", (donor, amount) => {
                console.log(`Donation Received: ${ethers.formatEther(amount)} ETH from ${donor}`);
                setStatusMessage(`Donation of ${ethers.formatEther(amount)} ETH received!`);
                //We'll define fetchContractBalance later
                 fetchContractBalance();
            });
            donationPool.on("AidDistributed", (refugee, amount) => {
                console.log(`Aid Distributed: ${ethers.formatEther(amount)} ETH to ${refugee}`);
                setStatusMessage(`Aid of ${ethers.formatEther(amount)} ETH distributed to ${refugee.substring(0, 6)}...!`);
                // We'll define fetchContractBalance later
                 fetchContractBalance();
            });

        } catch (error) {
            console.error("User denied account access or other error:", error);
            setStatusMessage("Please connect to MetaMask to use the app.");
            setAccount(''); // Clear account if connection failed
        }
    } else {
        console.error("MetaMask not detected!");
        setStatusMessage("MetaMask not detected. Please install it to use this app.");
        setAccount(''); // Clear account if MetaMask is not found
    }
};

const fetchContractBalance = async () => {
    if (donationPoolContract) { // Ensure the contract is initialized
        try {
            const balance = await donationPoolContract.getContractBalance(); // Call the getter
            setContractBalance(ethers.formatEther(balance)); // Convert Wei to ETH and set state
        } catch (error) {
            console.error("Error fetching contract balance:", error);
        }
    }
};

const handleDonate = async () => {
    if (donationPoolContract && signer && donationAmount) { // Ensure contracts are ready, signer exists, and amount is entered
        try {
            setStatusMessage("Sending donation...");
            // Call the 'donate' function on the contract, specifying the ETH value
            const tx = await donationPoolContract.donate({
                value: ethers.parseEther(donationAmount) // Convert human-readable ETH string to Wei
            });
            await tx.wait(); // Wait for the transaction to be mined on the blockchain
            setStatusMessage(`Donation of ${donationAmount} ETH successful!`);
            setDonationAmount(''); // Clear the input field
            await fetchContractBalance(); // Update the displayed contract balance
        } catch (error) {
            console.error("Donation failed:", error);
            setStatusMessage(`Donation failed: ${error.message}`);
        }
    } else {
        setStatusMessage("Please connect wallet and enter a donation amount.");
    }
};

useEffect(() => {
    loadBlockchainData();
}, [account]);


    // const checkRefugeeVerification = async (addr) => {
    //     if (verificationRegistryContract && addr) {
    //         try {
    //             const verified = await verificationRegistryContract.isVerified(addr);
    //             setIsRefugeeVerified(verified);
    //             setRefugeeAddress(addr);
    //         } catch (error) {
    //             console.error("Error checking verification:", error);
    //         }
    //     }
    // };

    const checkRefugeeVerification = async (addr) => {
      
    if (verificationRegistryContract && addr) { // Ensure contract is ready and an address is provided
        try {
          console.log(1);
            const verified = await verificationRegistryContract.isVerified(addr); // Call the getter
             console.log(verified);
            setIsRefugeeVerified(verified); // Update state with the result
             console.log(3);
            setRefugeeAddress(addr); // Set the address that was just checked
             console.log(4);
        } catch (error) {
           console.log(5);
            console.error("Error checking verification:", error);
             console.log(6);
            setStatusMessage(`Error checking verification: ${error.message}`);
             console.log(7);
            setIsRefugeeVerified(false);
        }
    }
};





    // const handleDonate = async () => {
    //     if (donationPoolContract && signer && donationAmount) {
    //         try {
    //             const tx = await donationPoolContract.donate({
    //                 value: ethers.utils.parseEther(donationAmount)
    //             });
    //             setStatusMessage("Sending donation...");
    //             await tx.wait();
    //             setStatusMessage(`Donation of ${donationAmount} ETH successful!`);
    //             setDonationAmount('');
    //             fetchContractBalance();
    //         } catch (error) {
    //             console.error("Donation failed:", error);
    //             setStatusMessage(`Donation failed: ${error.message}`);
    //         }
    //     } else {
    //         setStatusMessage("Please connect wallet and enter a donation amount.");
    //     }
    // };

    // const handleVerifyRefugee = async () => {
    //     if (verificationRegistryContract && signer && refugeeAddress) {
    //         try {
    //             const tx = await verificationRegistryContract.verifyRefugee(refugeeAddress);
    //             setStatusMessage(`Verifying refugee ${refugeeAddress.substring(0, 6)}...`);
    //             await tx.wait();
    //             setStatusMessage(`Refugee ${refugeeAddress.substring(0, 6)}... verified successfully!`);
    //             checkRefugeeVerification(refugeeAddress);
    //         } catch (error) {
    //             console.error("Refugee verification failed:", error);
    //             setStatusMessage(`Verification failed: ${error.message}`);
    //         }
    //     } else {
    //         setStatusMessage("Please connect wallet and enter a refugee address to verify.");
    //     }
    // };

    const handleVerifyRefugee = async () => {
    if (verificationRegistryContract && signer && refugeeAddress) { 
        try {
            // Get the connected wallet's address to use for the transaction
            const connectedSignerAddress = await signer.getAddress();
            
            setStatusMessage(`Verifying refugee ${refugeeAddress.substring(0, 6)}...`);
            
            // Explicitly set the 'from' address in the transaction options
            const tx = await verificationRegistryContract.verifyRefugee(
                refugeeAddress, 
                { from: connectedSignerAddress } // <-- Add this line
            );
            
            await tx.wait(); 
            setStatusMessage(`Refugee ${refugeeAddress.substring(0, 6)}... verified successfully!`);
            await checkRefugeeVerification(refugeeAddress);
        } catch (error) {
            console.error("Refugee verification failed:", error);
            setStatusMessage(`Verification failed: ${error.message}. Is your account authorized as an NGO?`);
        }
    } else {
        setStatusMessage("Please connect wallet and enter a refugee address to verify.");
    }
};
//     const handleVerifyRefugee = async () => {
//     if (verificationRegistryContract && signer && refugeeAddress) { // Ensure contract, signer, and refugee address are ready

      
//         try {
//             // --- ADD THE FOLLOWING LINES ---
//             const connectedSignerAddress = await signer.getAddress();
//             const contractOwnerAddress = await verificationRegistryContract.owner();
            
//             console.log("Connected Wallet Address:", connectedSignerAddress);
//             console.log("Contract Owner Address:", contractOwnerAddress);
            
//             if (connectedSignerAddress.toLowerCase() !== contractOwnerAddress.toLowerCase()) {
//               console.error("!!! ADDRESS MISMATCH DETECTED !!!");
//             }
//             // --- END OF ADDED LINES ---
//             setStatusMessage(`Verifying refugee ${refugeeAddress.substring(0, 6)}...`);
//             // Call the 'verifyRefugee' function on the contract
//             const tx = await verificationRegistryContract.verifyRefugee(refugeeAddress);
//             await tx.wait(); // Wait for the transaction to be mined
//             setStatusMessage(`Refugee ${refugeeAddress.substring(0, 6)}... verified successfully!`);
//             await checkRefugeeVerification(refugeeAddress); // Re-check status to update UI
//         } catch (error) {
//             console.error("Refugee verification failed:", error);
//             setStatusMessage(`Verification failed: ${error.message}. Is your account authorized as an NGO?`);
//         }
//     } else {
//         setStatusMessage("Please connect wallet and enter a refugee address to verify.");
//     }
// };

    const simulateAIDistribution = async (refugeeToAid) => {
        console.log(`AI Agent: Attempting to distribute aid to ${refugeeToAid}`);
        if (donationPoolContract && signer) {
            try {
                const contractOwner = await donationPoolContract.owner();
                if (account.toLowerCase() !== contractOwner.toLowerCase()) {
                    setStatusMessage("AI Agent requires DonationPool owner's account to distribute aid.");
                    console.warn("AI Agent: Not running as DonationPool owner, skipping distribution.");
                    return;
                }

                setStatusMessage(`AI Agent: Distributing aid to verified refugee ${refugeeToAid.substring(0, 6)}...`);
                const tx = await donationPoolContract.distributeAid(refugeeToAid);
                await tx.wait();
                setStatusMessage(`AI Agent: Aid successfully distributed to ${refugeeToAid.substring(0, 6)}...!`);
                fetchContractBalance();
            } catch (error) {
                console.error("AI Agent: Aid distribution failed:", error);
                setStatusMessage(`AI Agent: Aid distribution failed: ${error.message}`);
            }
        } else {
            setStatusMessage("AI Agent: DonationPool contract not initialized or wallet not connected.");
        }
    };

    // return (
    //     <div className="App">
    //         {/* ... header ... */}

    //         <section className="dashboard">
    //             <h2>Donation Pool Balance: {contractBalance} ETH</h2> {/* Displays the pool balance */}
    //         </section>

    //         <section className="donor-section">
    //             <h2>Donor Actions</h2>
    //             <input
    //                 type="text"
    //                 placeholder="ETH Amount (e.g., 0.1)"
    //                 value={donationAmount}
    //                 onChange={(e) => setDonationAmount(e.target.value)} // Update state on input change
    //             />
    //             <button onClick={handleDonate} disabled={!account || !donationAmount}>
    //                 Donate ETH
    //             </button> {/* Disable if no account or no amount */}
    //         </section>

    //         {/* Placeholder for other sections */}
    //         <section>
    //             <h2>Placeholder Section</h2>
    //             <p>More content will go here.</p>
    //         </section>

    //         <footer>
    //             <p>Hackathon Project - 4 Hour MVP</p>
    //         </footer>
    //     </div>
    // );

    return (
    <div className="App">
        <header className="App-header">
            <h1>Decentralized Refugee Aid MVP</h1>
            <p>Connected Account: {account ? account : 'Not Connected'}</p>
            {account && (
                <button onClick={() => window.ethereum.request({ method: 'eth_requestAccounts' })}>
                    Switch Account
                </button>
            )}
            {!account && (
                <button onClick={loadBlockchainData}>
                    Connect Wallet
                </button>
            )}
            <p className="status-message">{statusMessage}</p>
        </header>

         {/* <section className="dashboard">
            <h2>Donation Pool Balance: {contractBalance} ETH</h2>
        </section>

        <section className="donor-section">
            <h2>Donor Actions</h2>
            <input
                type="text"
                placeholder="ETH Amount"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
            />
            <button onClick={handleDonate} disabled={!account}>Donate ETH</button>
        </section>

        <section className="refugee-ngo-section">
            <h2>Refugee & NGO Actions</h2>
            <input
                type="text"
                placeholder="Refugee Wallet Address"
                value={refugeeAddress}
                onChange={(e) => setRefugeeAddress(e.target.value)}
            />
            <button onClick={() => checkRefugeeVerification(refugeeAddress)}>Check Verification Status</button>
            <p>Refugee {refugeeAddress ? refugeeAddress.substring(0, 6) + '...' : ''} Verified: <strong>{isRefugeeVerified ? 'Yes' : 'No'}</strong></p>

            <button onClick={handleVerifyRefugee} disabled={!account}>
                NGO: Verify Refugee
            </button>
            <p><em>(Note: Your connected account must be authorized as an NGO by the contract owner.)</em></p>
        </section>

        <footer>
            <p>Hackathon Project - 4 Hour MVP</p>
        </footer> */}
                    <section className="dashboard">
                <h2>Donation Pool Balance: {contractBalance} ETH</h2> {/* Displays the pool balance */}
            </section>

            <section className="donor-section">
                <h2>Donor Actions</h2>
                <input
                    type="text"
                    placeholder="ETH Amount (e.g., 0.1)"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)} // Update state on input change
                />
                <button onClick={handleDonate} disabled={!account || !donationAmount}>
                    Donate ETH
                </button> {/* Disable if no account or no amount */}
            </section>

            {/* Placeholder for other sections */}
            <section>
                <h2>Placeholder Section</h2>
                <p>More content will go here.</p>
            </section>

             <section className="refugee-ngo-section">
                <h2>Refugee & NGO Actions</h2>
                <input
                    type="text"
                    placeholder="Refugee Wallet Address (e.g., 0x...)"
                    value={refugeeAddress}
                    onChange={(e) => setRefugeeAddress(e.target.value)} // Update state on input change
                />
                <button onClick={() => checkRefugeeVerification(refugeeAddress)}>
                    Check Verification Status
                </button>
                <p>
                    Refugee {refugeeAddress ? refugeeAddress.substring(0, 6) + '...' : ''} Verified:
                    <strong>{isRefugeeVerified ? 'Yes' : 'No'}</strong> {/* Display status */}
                </p>

                <button onClick={handleVerifyRefugee} disabled={!account || !refugeeAddress}>
                    NGO: Verify Refugee
                </button>
                <p>
                    <em>(Note: Your connected account must be authorized as an NGO by the contract owner in Remix.)</em>
                </p>
            </section>

            <footer>
                <p>Hackathon Project - 4 Hour MVP</p>
            </footer>
        
    </div>
);

}

export default App;

