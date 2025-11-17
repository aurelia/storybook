import { bindable } from 'aurelia';

export interface FeedbackPayload {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export class FeedbackForm {
  @bindable() topics: string[] = ['Bug report', 'Feature idea', 'General praise'];
  @bindable() submitting = false;
  @bindable() onSubmit?: (payload: FeedbackPayload) => Promise<void> | void;

  form: FeedbackPayload = {
    name: '',
    email: '',
    topic: 'Bug report',
    message: '',
  };

  submitted = false;

  async submit(event?: Event) {
    event?.preventDefault();
    if (this.submitting) {
      return;
    }

    this.submitting = true;
    await this.onSubmit?.({ ...this.form });
    this.submitting = false;
    this.submitted = true;
  }

  reset() {
    this.form = {
      name: '',
      email: '',
      topic: this.topics[0] ?? '',
      message: '',
    };
    this.submitted = false;
  }
}
