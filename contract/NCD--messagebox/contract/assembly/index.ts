import { context, ContractPromiseBatch, PersistentMap, storage, u128 } from 'near-sdk-as'
import { toYocto } from './utils';

/**************************/
/* TYPES */
/**************************/

@nearBindgen
export class Message {
  constructor(public timestamp: u64, public message: string, public sender: string) {
  }
}

/**************************/
/* STORAGE AND COLLECTIONS */
/**************************/

const messages = new PersistentMap<string, Message[]>('m')
// PUT YOUR ACCOUNT
const contractOwner = "kbastard2.testnet";
const messageLimit = 20;
export const startFee = 0.001;


/**************************/
/* PUBLIC METHODS */
/**************************/

export function initContract(): void {
  /// Initializes the contract with the given NEAR foundation account ID.
  assert(!storage.hasKey('message_fee'), 'Already initialized')
  assert(context.predecessor == contractOwner, "Only the owner can call this method");
  storage.set('message_fee', startFee);
}

export function uninitContract(): void {
  assert(context.predecessor == contractOwner, "Only the owner can call this method");
  storage.delete('message_fee');
  storage.delete('m');
}

export function sendMessage(target_account_id: string, message: string): void {
  _isInit();
  assert(context.predecessor != target_account_id, "Not possible to send a message to yourself");
  assert(message.length < 120, "Message too long, only less than 120 character allowed");
  const message_fee = toYocto(storage.getSome<number>("message_fee"));

  assert(context.attachedDeposit >= message_fee, 'Message fee not paid');

  _addMessage(target_account_id, message);
  ContractPromiseBatch.create(target_account_id).transfer(u128.sub(context.attachedDeposit, message_fee));
}

export function retrieveMessages(accountId: string): Message[] | null {
  _isInit();
  const message_bucket = messages.get(accountId);
  return message_bucket;
}

export function deleteAllMessages(): void {
  _isInit();
  messages.set(context.predecessor, []);
}

export function changeFee(message_fee: number): void {
  _isInit();
  assert(context.predecessor == contractOwner, "Only the ContractOwner can change the fee");
  assert(0.1 >= message_fee && message_fee >= 0.0000001, "Message fee should be between 0.1 and 0.0000001");
  storage.set("message_fee", message_fee);
}

export function getCurrentFee(): number {
  return storage.getSome<number>("message_fee");
}


// /**************************/
// /* PRIVATE METHODS */
// /**************************/

function _addMessage(target_account_id: string, message: string): void {
  const message_bucket = messages.get(target_account_id);
  const new_message = new Message(context.blockTimestamp, message, context.predecessor);

  if (message_bucket == null) {
    const messageArray = new Array<Message>();
    messageArray.push(new_message);
    messages.set(target_account_id, messageArray);
  }
  else {
    assert(message_bucket.length <= messageLimit, "The postbox of " + target_account_id + " is full");
    message_bucket.push(new_message);
    messages.set(target_account_id, message_bucket);
  }
}

function _isInit(): void {
  assert(storage.hasKey('message_fee'), 'The contract should be initialized before usage.')
}
