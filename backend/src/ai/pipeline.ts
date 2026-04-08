import logger from '../utils/logger';

// Singleton to hold model instances
class AIPipeline {
    private static instance: AIPipeline;
    private embedder: any;

    private constructor() { }

    static getInstance(): AIPipeline {
        if (!AIPipeline.instance) {
            AIPipeline.instance = new AIPipeline();
        }
        return AIPipeline.instance;
    }

    async init() {
        try {
            if (!this.embedder) {
                logger.info('Loading lightweight Embedding model...');
                // Dynamic import for ESM module - using Function constructor to bypass CJS transpilation
                const { pipeline } = await (new Function('return import("@xenova/transformers")')());
                console.log('Using HuggingFace Model: Xenova/all-MiniLM-L6-v2 for Embeddings');
                this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
                logger.info('✅ Embedding model loaded successfully');
            }
            // Removed heavy models: NER, Classifier, Summarizer to save memory
        } catch (error) {
            logger.error('Failed to load AI models', error);
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!text) return new Array(384).fill(0);

        if (!this.embedder) await this.init();

        // If still no embedder after init, return zero vector fallback
        if (!this.embedder) {
            logger.warn('Embedding model not available, using zero-vector fallback');
            return new Array(384).fill(0);
        }

        try {
            const output = await this.embedder(text, { pooling: 'mean', normalize: true });
            return Array.from(output.data);
        } catch (error) {
            logger.error('Embedding generation failed', error);
            return new Array(384).fill(0);
        }
    }

    // Simplified skill extraction using keyword matching instead of NER
    async extractSkills(text: string): Promise<string[]> {
        const commonSkills = [
            'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js',
            'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git',
            'HTML', 'CSS', 'Angular', 'Vue', 'Express', 'Django', 'Flask',
            'PostgreSQL', 'Redis', 'GraphQL', 'REST', 'API', 'Agile', 'Scrum'
        ];

        const foundSkills = commonSkills.filter(skill =>
            text.toLowerCase().includes(skill.toLowerCase())
        );

        return foundSkills;
    }

    async calculateSimilarity(emb1: number[], emb2: number[]): Promise<number> {
        const dotProduct = emb1.reduce((sum, val, i) => sum + val * emb2[i], 0);
        const mag1 = Math.sqrt(emb1.reduce((sum, val) => sum + val * val, 0));
        const mag2 = Math.sqrt(emb2.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (mag1 * mag2);
    }

    // Removed classifier and summarizer methods - not needed for basic matching
}

export const aiPipeline = AIPipeline.getInstance();
