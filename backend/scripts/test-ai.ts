import { aiPipeline } from '../src/ai/pipeline';
import logger from '../src/utils/logger';

async function testAI() {
    console.log('--- Testing AI Pipeline ---');
    try {
        console.log('1. initializing Pipeline...');
        await aiPipeline.init();
        console.log('✅ Pipeline Initialized');

        console.log('2. Testing Embeddings (all-MiniLM-L6-v2)...');
        const vec = await aiPipeline.generateEmbedding('Software Engineer at Google');
        console.log(`✅ Embedding generated. Length: ${vec.length}`);

        console.log('3. Testing NER (bert-base-NER)...');
        const skills = await aiPipeline.extractSkills('Looking for Python and React developers');
        console.log(`✅ Skills extracted: ${skills.join(', ')}`);

        console.log('4. Testing Classification (bart-large-mnli)...');
        const category = await aiPipeline.classifyJob('We need a frontend developer with React skills', ['Engineering', 'Sales', 'Marketing']);
        console.log(`✅ Classification result:`, category);

        console.log('5. Testing Summarization (distilbart-cnn-12-6)...');
        const summary = await aiPipeline.summarizeJob('We are looking for a software engineer. The role involves writing code, debugging, and deploying applications. You must have 5 years of experience in Node.js.');
        console.log(`✅ Summary: ${summary}`);

        console.log('--- ALL AI TESTS PASSED ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ AI Test Failed:', error);
        process.exit(1);
    }
}

testAI();
