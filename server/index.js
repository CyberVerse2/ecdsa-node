const express = require('express');
const app = express();
const cors = require('cors');
const { toHex, hexToBytes, utf8ToBytes, bytesToUtf8 } = require('ethereum-cryptography/utils');
const { keccak256 } = require('ethereum-cryptography/keccak');
const { secp256k1 } = require('ethereum-cryptography/secp256k1');

const privateKey = secp256k1.utils.randomPrivateKey();
console.log(toHex(privateKey));
const userPrivateKey = '87d03a242352f80516146ee941d965485949d797fde27557dcbeb76a5740830f';
// console.log(toHex(secp256k1.getPublicKey(privateKey)));
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  '037d73020a4114493be2f2a02d7582d960be2ddbb79bce968f6a286f0af482621f': 100,
  '0229ed584d12d450f36045f0d6a2e14f52d1443ce025858f2216de318ba86af5af': 50,
  '0214e6a282ddd3127492708d5a6c81d597aa10150ab42ff4def4da779af62e6c82': 75
};
const publicPrivatePair = {
  '037d73020a4114493be2f2a02d7582d960be2ddbb79bce968f6a286f0af482621f':
    '87d03a242352f80516146ee941d965485949d797fde27557dcbeb76a5740830f',
  '0229ed584d12d450f36045f0d6a2e14f52d1443ce025858f2216de318ba86af5af':
    'abcd6fe7b6a17ff693fb9d16bf24df09689a094b20083a3688875afe838ed68f',
  '0214e6a282ddd3127492708d5a6c81d597aa10150ab42ff4def4da779af62e6c82':
    '93f18e9f750c2036667a73b9dc16f5053bfa9e248aa8ee7bf86c1f7f5ce1909f'
};

app.get('/balance/:address', (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send',async (req, res) => {
  const { sender, recipient, amount } = req.body;
  const senderPrivateKey = publicPrivatePair[sender];
  const reciever = balances[recipient];
  if (!senderPrivateKey) {
    console.log('no private key for sender');
  }
  if (!reciever) {
    console.log('this public key doesnt exists in the blockchain');
  }

  if (balances[sender] < amount) {
    res.status(400).send({ message: 'Not enough funds!' });
  } else {
    const txData = {
      to: recipient,
      value: amount,
      nonce: 0
    };
    console.log('wahal');
    const hex = utf8ToBytes(`0x${txData.to}${txData.value}${txData.nonce}`);
    const message = keccak256(hex);

    balances[sender] -= amount;
    balances[recipient] += amount;
    const bytes = BigInt(senderPrivateKey)
    console.log(bytes, typeof bytes)
    const signature = secp256k1.sign(message, bytes);
    res.send({ balance: balances[sender], signature: toHex(signature.signature) });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
