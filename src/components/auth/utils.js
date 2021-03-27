import {BigNumber, providers, utils} from "ethers";
import {PrivateKey} from "@textile/hub";

const generateMessageForEntropy = (ethereum_address, application_name, secret) => (
    '******************************************************************************** \n' +
    'READ THIS MESSAGE CAREFULLY. \n' +
    'DO NOT SHARE THIS SIGNED MESSAGE WITH ANYONE OR THEY WILL HAVE READ AND WRITE \n' +
    'ACCESS TO THIS APPLICATION. \n' +
    'DO NOT SIGN THIS MESSAGE IF THE FOLLOWING IS NOT TRUE OR YOU DO NOT CONSENT \n' +
    'TO THE CURRENT APPLICATION HAVING ACCESS TO THE FOLLOWING APPLICATION. \n' +
    '******************************************************************************** \n' +
    'The Ethereum address used by this application is: \n' +
    '\n' +
    ethereum_address +
    '\n' +
    '\n' +
    '\n' +
    'By signing this message, you authorize the current application to use the \n' +
    'following app associated with the above address: \n' +
    '\n' +
    application_name +
    '\n' +
    '\n' +
    '\n' +
    'your non-recoverable, private, non-persisted password or secret \n' +
    'phrase is: \n' +
    '\n' +
    secret +
    '\n' +
    '\n' +
    '\n' +
    '******************************************************************************** \n' +
    'ONLY SIGN THIS MESSAGE IF YOU CONSENT TO THE CURRENT PAGE ACCESSING THE KEYS \n' +
    'ASSOCIATED WITH THE ABOVE ADDRESS AND APPLICATION. \n' +
    'AGAIN, DO NOT SHARE THIS SIGNED MESSAGE WITH ANYONE OR THEY WILL HAVE READ AND \n' +
    'WRITE ACCESS TO THIS APPLICATION. \n' +
    '******************************************************************************** \n'
)

const getSigner = async () => {
    if (!window.ethereum) {
        throw new Error(
            'Ethereum is not connected. Please download Metamask from https://metamask.io/download.html'
        );
    }

    console.debug('Initializing web3 provider...');
    const provider = new providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return signer
}

const getAddressAndSigner = async () => {
    const signer = await getSigner()
    // @ts-ignore
    const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
    if (accounts.length === 0) {
        throw new Error('No account is provided. Please provide an account to this application.');
    }

    const address = accounts[0];

    return {address, signer}
}

export const generatePrivateKey = async (password) => {
    const metamask = await getAddressAndSigner()
    // avoid sending the raw secret by hashing it first
    const secret = password
    const message = generateMessageForEntropy(metamask.address, 'Notes', secret)
    const signedText = await metamask.signer.signMessage(message);
    const hash = utils.keccak256(signedText);
    if (hash === null) {
        throw new Error('No account is provided. Please provide an account to this application.');
    }
    // The following line converts the hash in hex to an array of 32 integers.
    // @ts-ignore
    const array = hash
        // @ts-ignore
        .replace('0x', '')
        // @ts-ignore
        .match(/.{2}/g)
        .map((hexNoPrefix) => BigNumber.from('0x' + hexNoPrefix).toNumber())

    if (array.length !== 32) {
        throw new Error('Hash of signature is not the correct size! Something went wrong!');
    }
    const identity = PrivateKey.fromRawEd25519Seed(Uint8Array.from(array))
    console.log(identity.toString())

    // Your app can now use this identity for generating a user Mailbox, Threads, Buckets, etc
    return identity
}