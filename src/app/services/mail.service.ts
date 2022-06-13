import { Injectable } from '@angular/core';
import { NearService } from "./near.service";
import { format, fromUnixTime } from "date-fns";
import { ToastrService } from "ngx-toastr";

@Injectable({
  providedIn: 'root'
})
export class MailService {
  public myMessages: any[] = [];
  public isLoading = false;
  public err: any = null;

  constructor(public nearService: NearService, private toastr: ToastrService) {
  }

  async loadMessages() {
    this.isLoading = true;
    try {
      this.err = null;
      this.myMessages = await this.nearService.getMessages(this.nearService.accountId);
    } catch (e) {
      this.err = e;
      console.log(e);
    } finally {
      this.isLoading = false;
    }
  }

  // Not possible to send a message to yourself
  async handleSendMessage({ target_account_id, message }: { target_account_id: any, message: any }) {
    this.isLoading = true;
    try {
      await this.nearService.sendMessage({ target_account_id, message });
      this.myMessages = await this.nearService.getMessages(this.nearService.accountId);
    } catch (e: any) {
      let message = this.err = e?.kind?.ExecutionError;
      this.toastr.error(message.slice(0, message.match(', filename').index));
    } finally {
      this.isLoading = false;
    }
  }

  async handleDeleteAllMessages() {
    this.isLoading = true;
    await this.nearService.deleteAllMessages();
    this.myMessages = await this.nearService.getMessages(this.nearService.accountId);
    this.isLoading = false;
  }

  formatDate(data: any) {
    return format(new Date(fromUnixTime(parseInt(data.timestamp.substring(0, 10)))), "MMMM do yyyy");
  }

  async restoreDefaultContract() {
    this.nearService.restoreDefaultContract();
    await this.loadMessages();
  }
}
