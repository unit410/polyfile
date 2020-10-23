import Message from './Message';
import Signature from './Signature';

interface SignedMessage {
  message: Message;
  signature: Signature;
}

export default SignedMessage;
