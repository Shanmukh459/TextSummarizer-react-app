import { pipeline } from '@xenova/transformers';

class MySummarizerPipeline {
    static task = 'summarization'
    static model = 'Xenova/distilbart-cnn-12-6'
    static instance = null

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback })
        }
        return this.instance
    }

}

self.addEventListener('message', async (event) => {
    let summarizer = await MySummarizerPipeline.getInstance(x => {
        self.postMessage(x)
    })
    console.log(event.data.text)
    let output = await summarizer(event.data.text, {
        callback_function: x => {
            self.postMessage ({
                status: 'update',
                output: summarizer.tokenizer.decode(x[0].output_token_ids, { max_new_tokens: 500, skip_special_tokens: true })
            })
        }
    })
    
    self.postMessage({
        status:'complete',
        output: output
    })
});

