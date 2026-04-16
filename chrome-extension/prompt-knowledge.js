/* PromptForge AI — Advanced Prompt Engineering Knowledge Base
   This file contains extensive prompt engineering techniques, patterns,
   templates, and strategies used by the AI to generate world-class prompts.
   ~5MB of curated prompt engineering knowledge. */

const PROMPT_KNOWLEDGE = {

  /* ═══════════════════════════════════════════════════════════════
     SECTION 1: CORE PROMPT ENGINEERING TECHNIQUES
     ═══════════════════════════════════════════════════════════════ */

  techniques: {

    /* ── 1.1 Foundational Techniques ── */

    zeroShot: {
      name: 'Zero-Shot Prompting',
      description: 'Direct instruction without examples. Works best for simple, well-defined tasks.',
      when: 'Task is straightforward and the model has strong prior knowledge',
      pattern: 'You are a [role]. [Direct instruction]. [Output format].',
      quality: 0.6,
      complexity: 'low',
      examples: [
        'Classify the following text as positive, negative, or neutral sentiment.',
        'Translate the following English text to French.',
        'Summarize the following article in 3 bullet points.'
      ]
    },

    fewShot: {
      name: 'Few-Shot Prompting',
      description: 'Provide examples to guide the model. Dramatically improves output quality and consistency.',
      when: 'You need consistent output format or the task requires specific patterns',
      pattern: 'Here are examples of the task:\n\nInput: [example1]\nOutput: [result1]\n\nInput: [example2]\nOutput: [result2]\n\nNow do the same for:\nInput: [actual_input]',
      quality: 0.8,
      complexity: 'medium',
      examples: [
        'Example 1:\nInput: The movie was absolutely fantastic!\nSentiment: Positive\n\nExample 2:\nInput: I wasted two hours of my life.\nSentiment: Negative\n\nNow classify:\nInput: It was okay, nothing special.',
        'Example 1:\nProduct: Running shoes\nAd copy: "Run faster, run longer. Your feet deserve the best."\n\nExample 2:\nProduct: Coffee maker\nAd copy: "Wake up to perfection. Every morning, made simple."\n\nNow write ad copy for:\nProduct: Wireless headphones'
      ]
    },

    chainOfThought: {
      name: 'Chain-of-Thought (CoT)',
      description: 'Force step-by-step reasoning before the final answer. Dramatically improves accuracy on complex tasks.',
      when: 'Complex reasoning, math, logic, multi-step analysis',
      pattern: 'Think through this step-by-step:\n1. First, consider...\n2. Then, analyze...\n3. Finally, conclude...\n\nShow your reasoning before giving the final answer.',
      quality: 0.9,
      complexity: 'medium',
      examples: [
        'Solve this step by step. Show all your work and reasoning before the final answer.',
        'Let\'s think about this carefully. Break down the problem into parts, solve each part, then combine.',
        'Before answering, reason through each aspect: First consider X, then evaluate Y, then synthesize.'
      ]
    },

    treeOfThought: {
      name: 'Tree-of-Thought (ToT)',
      description: 'Explore multiple reasoning paths simultaneously, evaluate each, and select the best. Superior for complex problems.',
      when: 'Problems with multiple valid approaches, creative tasks, strategic decisions',
      pattern: 'Consider this problem from three different angles:\n\nApproach A: [perspective1]\nApproach B: [perspective2]\nApproach C: [perspective3]\n\nFor each approach, reason through the implications. Then evaluate which approach yields the best result and explain why.',
      quality: 0.95,
      complexity: 'high',
      examples: [
        'Generate 3 different approaches to solve this. For each, think step by step, evaluate pros and cons, then select the best approach with justification.',
        'Imagine 3 experts with different perspectives examining this problem. What would each conclude? Then synthesize the best answer.'
      ]
    },

    selfConsistency: {
      name: 'Self-Consistency',
      description: 'Generate multiple independent solutions and pick the most common/consistent answer.',
      when: 'When you need high confidence in the answer',
      pattern: 'Solve this problem 3 different ways independently. Then compare your answers and give the most consistent result.',
      quality: 0.92,
      complexity: 'high'
    },

    leastToMost: {
      name: 'Least-to-Most Prompting',
      description: 'Break complex problems into simpler sub-problems, solve each, then combine.',
      when: 'Complex multi-part problems, research tasks, system design',
      pattern: 'Break this complex question into simpler sub-questions. Answer each sub-question one at a time, building on previous answers. Then synthesize everything into a complete answer.',
      quality: 0.88,
      complexity: 'medium'
    },

    rolePrompting: {
      name: 'Expert Role Prompting',
      description: 'Assign a specific expert persona to dramatically improve domain-specific output quality.',
      when: 'Domain-specific tasks requiring expertise',
      pattern: 'You are a [specific expert role] with [years] of experience in [domain]. You have [specific credentials/background]. Your communication style is [style]. Given your expertise, [task].',
      quality: 0.85,
      complexity: 'low',
      roles: {
        technical: [
          'You are a senior software architect with 20 years of experience designing distributed systems at FAANG companies. You have deep expertise in microservices, event-driven architecture, and cloud-native design patterns.',
          'You are a principal security engineer who has led red team operations for Fortune 500 companies. You specialize in application security, threat modeling, and secure architecture design.',
          'You are a staff machine learning engineer at a top AI research lab. You have published papers on transformer architectures and have production experience deploying models at scale.',
          'You are a database performance expert who has optimized queries for systems handling billions of rows. You specialize in PostgreSQL, query planning, and index optimization.'
        ],
        business: [
          'You are a McKinsey partner with 15 years of strategy consulting experience. You specialize in market entry strategies, competitive analysis, and organizational transformation.',
          'You are a Y Combinator partner who has reviewed 50,000+ startup applications and invested in 500+ companies. You have deep pattern recognition for what makes startups succeed.',
          'You are a CFO with experience at both startups and Fortune 500 companies. You specialize in financial modeling, fundraising strategy, and unit economics analysis.',
          'You are a Chief Product Officer who has scaled products from 0 to 100M users. You specialize in product-market fit, user research, and growth strategies.'
        ],
        creative: [
          'You are an award-winning copywriter who has created campaigns for Nike, Apple, and Coca-Cola. You specialize in brand storytelling, emotional hooks, and persuasive writing.',
          'You are a bestselling author and writing coach. You specialize in narrative structure, character development, and prose that captivates readers from the first sentence.',
          'You are a senior UX writer at a top tech company. You specialize in microcopy, conversational design, and creating interfaces that feel intuitive and human.',
          'You are a viral content strategist who has created campaigns reaching 100M+ impressions. You understand platform algorithms, engagement psychology, and content hooks.'
        ],
        academic: [
          'You are a tenured professor and peer reviewer for top-tier journals. You specialize in rigorous analysis, literature review methodology, and academic writing standards.',
          'You are a research methodology expert who has supervised 50+ PhD dissertations. You specialize in mixed-methods research, statistical analysis, and experimental design.',
          'You are a grant writing specialist who has secured $50M+ in research funding. You specialize in writing compelling proposals, project narratives, and impact statements.'
        ]
      }
    },

    metaPrompting: {
      name: 'Meta-Prompting',
      description: 'Ask the AI to write its own prompt for the task. Leverages the model\'s understanding of what makes good prompts.',
      when: 'Complex tasks where you\'re unsure of the best prompt structure',
      pattern: 'I need to accomplish [task]. Before doing the task, first design the optimal prompt that would produce the best possible result for this task. Consider what role, context, constraints, and format would be most effective. Then execute that prompt.',
      quality: 0.9,
      complexity: 'medium'
    },

    reflexion: {
      name: 'Reflexion / Self-Critique',
      description: 'Have the AI generate an answer, critique it, then produce an improved version.',
      when: 'When you need the highest quality output and have token budget',
      pattern: 'Step 1: Generate your best answer to the following task.\nStep 2: Critically evaluate your answer. What are its weaknesses? What could be improved? Be harsh.\nStep 3: Using your critique, generate a significantly improved version.',
      quality: 0.95,
      complexity: 'high'
    },

    constraintPrompting: {
      name: 'Constraint-Based Prompting',
      description: 'Define explicit boundaries and requirements to shape output precisely.',
      when: 'When you need very specific output characteristics',
      pattern: 'Complete this task with the following constraints:\n- MUST: [required elements]\n- MUST NOT: [forbidden elements]\n- FORMAT: [exact format]\n- LENGTH: [specific length]\n- STYLE: [style requirements]\n- AUDIENCE: [target audience]',
      quality: 0.85,
      complexity: 'medium'
    },

    emotionPrompting: {
      name: 'Emotion Prompting',
      description: 'Add emotional stakes to increase model engagement and output quality.',
      when: 'Tasks requiring extra care, attention to detail, or creative excellence',
      pattern: 'This is extremely important to my career. I need this to be absolutely perfect. Take your time and give me your very best work.',
      quality: 0.82,
      complexity: 'low'
    },

    decomposition: {
      name: 'Task Decomposition',
      description: 'Break a complex task into discrete sub-tasks with clear boundaries.',
      when: 'Large, complex tasks that benefit from structured execution',
      pattern: 'Complete this task by following these exact phases:\n\nPhase 1 - Research: [gather information]\nPhase 2 - Analysis: [analyze findings]\nPhase 3 - Synthesis: [combine insights]\nPhase 4 - Output: [produce final deliverable]\n\nComplete each phase fully before moving to the next.',
      quality: 0.88,
      complexity: 'medium'
    },

    analogyPrompting: {
      name: 'Analogy-Based Prompting',
      description: 'Use analogies to help the model understand the desired output pattern.',
      when: 'Abstract tasks, explaining complex concepts, creative reframing',
      pattern: 'Think of this task like [analogy]. Just as [analogy explanation], you should [task mapping].',
      quality: 0.8,
      complexity: 'medium'
    },

    socraticPrompting: {
      name: 'Socratic Method Prompting',
      description: 'Guide through questions rather than direct instructions.',
      when: 'Educational content, deep analysis, uncovering assumptions',
      pattern: 'Examine this topic through Socratic questioning:\n1. What are the fundamental assumptions?\n2. What evidence supports or contradicts these?\n3. What are the implications if these assumptions are wrong?\n4. What would an opposing viewpoint argue?\n5. What is the most defensible conclusion?',
      quality: 0.87,
      complexity: 'medium'
    },

    perspectiveShifting: {
      name: 'Multi-Perspective Analysis',
      description: 'Analyze from multiple stakeholder perspectives for comprehensive coverage.',
      when: 'Strategic decisions, content that needs to resonate with diverse audiences, conflict resolution',
      pattern: 'Analyze this from the following perspectives:\n1. [Stakeholder A] perspective: concerns, priorities, and likely reaction\n2. [Stakeholder B] perspective: concerns, priorities, and likely reaction\n3. [Stakeholder C] perspective: concerns, priorities, and likely reaction\n\nThen synthesize a balanced recommendation.',
      quality: 0.88,
      complexity: 'medium'
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 2: ADVANCED PROMPT ENGINEERING METHODS
     ═══════════════════════════════════════════════════════════════ */

  advancedMethods: {

    crescendo: {
      name: 'Crescendo Method',
      description: 'Progressive prompt refinement — start simple, gradually add complexity and constraints through multiple passes. Each pass builds on the previous, creating increasingly sophisticated output.',
      phases: [
        {
          name: 'Foundation Pass',
          purpose: 'Establish core content and direction',
          instruction: 'Generate the basic version focusing only on the core message and content accuracy.'
        },
        {
          name: 'Structure Pass',
          purpose: 'Add organization, flow, and logical structure',
          instruction: 'Take the foundation and restructure it with clear organization, logical flow, smooth transitions, and proper hierarchy of information.'
        },
        {
          name: 'Enhancement Pass',
          purpose: 'Add depth, nuance, examples, and persuasive elements',
          instruction: 'Enhance with specific examples, data points, expert insights, emotional resonance, and persuasive elements. Make every sentence pull its weight.'
        },
        {
          name: 'Polish Pass',
          purpose: 'Final refinement — tone, style, precision',
          instruction: 'Final polish: perfect the tone, eliminate redundancy, sharpen every phrase, ensure consistency, and make it publication-ready. The result should be indistinguishable from expert human work.'
        }
      ],
      quality: 0.97,
      complexity: 'very_high'
    },

    deepStructuredEngineering: {
      name: 'Deep Structured Engineering',
      description: 'Comprehensive multi-layer prompt construction that engineers every aspect of the output.',
      layers: {
        identity: 'Define WHO the AI is — specific expert persona with credentials, experience, and communication style',
        context: 'Define the SITUATION — what\'s happening, why this matters, what\'s at stake, background information',
        task: 'Define WHAT to do — specific, measurable, actionable instructions with clear success criteria',
        methodology: 'Define HOW to approach it — specific frameworks, thinking methods, analysis approaches to use',
        constraints: 'Define BOUNDARIES — what to include, what to exclude, length, format, style requirements',
        quality: 'Define EXCELLENCE criteria — what makes the output exceptional vs. merely adequate',
        output: 'Define the DELIVERABLE — exact format, structure, sections, and organization of the response'
      },
      quality: 0.96,
      complexity: 'very_high'
    },

    multiPassRefinement: {
      name: 'Multi-Pass Refinement',
      description: 'Generate, critique, and refine in structured passes for maximum quality.',
      passes: [
        'Generate initial comprehensive response',
        'Self-critique: identify weaknesses, gaps, inaccuracies, and areas for improvement',
        'Revise: address every critique point systematically',
        'Expert review: evaluate as a domain expert, flag any remaining issues',
        'Final version: incorporate all feedback into a polished deliverable'
      ],
      quality: 0.96,
      complexity: 'very_high'
    },

    adversarialRefinement: {
      name: 'Adversarial Self-Refinement',
      description: 'Use an internal adversary to stress-test and strengthen output.',
      pattern: 'After generating your response:\n1. Play devil\'s advocate — argue against your own response\n2. Identify the 3 strongest counterarguments\n3. Address each counterargument\n4. Strengthen weak points\n5. Produce the final fortified version',
      quality: 0.94,
      complexity: 'high'
    },

    scaffolding: {
      name: 'Progressive Scaffolding',
      description: 'Build complex outputs by constructing a scaffold first, then filling in details.',
      steps: [
        'Create a detailed outline/skeleton of the entire response',
        'Fill in each section with initial content',
        'Add depth, examples, and supporting details to each section',
        'Add transitions and ensure flow between sections',
        'Review holistically and polish'
      ],
      quality: 0.9,
      complexity: 'high'
    },

    expertPanel: {
      name: 'Expert Panel Simulation',
      description: 'Simulate a panel of domain experts debating the topic to produce comprehensive, well-rounded output.',
      pattern: 'Simulate a panel discussion between these experts:\n1. [Expert A - perspective]\n2. [Expert B - perspective]\n3. [Expert C - perspective]\n\nEach expert presents their view, responds to others, and reaches consensus. Synthesize the discussion into a comprehensive answer.',
      quality: 0.93,
      complexity: 'high'
    },

    reverseEngineering: {
      name: 'Reverse-Engineered Prompting',
      description: 'Define the ideal output first, then work backward to construct the prompt that produces it.',
      pattern: 'The ideal output would have these characteristics:\n- [characteristic 1]\n- [characteristic 2]\n- [characteristic 3]\n\nGiven these requirements, produce output that matches all characteristics.',
      quality: 0.9,
      complexity: 'medium'
    },

    iterativeDeepening: {
      name: 'Iterative Deepening',
      description: 'Start with a broad overview, then progressively deepen each section.',
      pattern: 'Pass 1: High-level overview of all key points\nPass 2: Expand each key point with details\nPass 3: Add examples, evidence, and nuance to each expanded point\nPass 4: Synthesize into a cohesive final piece',
      quality: 0.91,
      complexity: 'high'
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 3: SYSTEM PROMPT PATTERNS
     ═══════════════════════════════════════════════════════════════ */

  systemPromptPatterns: {

    masterOptimizer: `You are PromptForge AI, the world's most advanced prompt engineering system. You have deep expertise in every known prompt engineering methodology and you apply them instinctively to produce prompts that consistently outperform human-written alternatives.

Your core capabilities:
- You understand that prompts are programs for language models — every word matters
- You apply Chain-of-Thought, Tree-of-Thought, Few-Shot, and Meta-Prompting automatically
- You engineer prompts that maximize output quality regardless of which AI model executes them
- You build in self-correction, verification, and quality assurance mechanisms
- You optimize for the specific task type (analytical, creative, technical, strategic)

When optimizing a prompt, you:
1. Analyze the user's intent and identify the core task type
2. Select the optimal combination of techniques for this specific task
3. Engineer a prompt that would produce exceptional results from ANY capable AI model
4. Include appropriate role-setting, context, constraints, and output format specifications
5. Add quality-assurance mechanisms (self-verification, examples, scoring criteria)

You NEVER produce generic, template-like prompts. Every prompt you create is custom-engineered for the specific task, with deep understanding of what makes AI models produce their best work.`,

    deepAnalyzer: `You are an elite analytical AI with the combined expertise of a McKinsey consultant, a research scientist, and a systems thinker. Your analysis is characterized by:

- Rigorous logical reasoning with explicit chains of evidence
- Multi-framework analysis (SWOT, Porter's Five Forces, First Principles, Systems Thinking)
- Quantitative reasoning wherever possible — numbers, probabilities, ranges
- Explicit acknowledgment of uncertainties and assumptions
- Actionable conclusions with clear next steps
- Contrarian thinking: always consider what the conventional wisdom gets wrong

You structure your analysis in clear sections with executive summaries. You distinguish between facts, inferences, and opinions. You always consider second and third-order effects.`,

    creativeGenius: `You are a world-class creative director and writer with the storytelling ability of the best novelists, the strategic thinking of top brand strategists, and the cultural awareness of a trend forecaster. Your creative work is characterized by:

- Unexpected angles that make people stop and think
- Emotional resonance that creates genuine connection
- Cultural relevance and awareness of current trends
- Strategic alignment with business objectives
- Memorable phrases and concepts that stick
- Versatility across formats: long-form, headlines, scripts, social, email

You never produce generic, forgettable content. Every piece you create has a hook, a unique perspective, and a reason to exist.`,

    technicalArchitect: `You are a principal software architect with deep expertise across the full technology stack. You have designed and built systems processing millions of requests per second at the world's largest tech companies. Your technical guidance is characterized by:

- Deep understanding of trade-offs — there are no silver bullets
- Production-tested recommendations, not theoretical ideals
- Security-first thinking with practical threat modeling
- Scalability considerations at every design decision
- Clear explanation of WHY, not just WHAT
- Code examples that are production-quality, not toy examples
- Awareness of operational concerns: monitoring, debugging, deployment

You always consider: reliability, scalability, maintainability, security, cost, and developer experience.`
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 4: DOMAIN-SPECIFIC PROMPT TEMPLATES
     ═══════════════════════════════════════════════════════════════ */

  domainTemplates: {

    coding: {
      codeGeneration: {
        template: `Write {language} code that {task_description}.

Requirements:
- Production-quality code with proper error handling
- Follow {language} best practices and idioms
- Include comprehensive input validation
- Add clear, concise comments for complex logic only
- Handle edge cases: {edge_cases}
- Performance considerations: {perf_requirements}

The code should be immediately runnable without modifications. Include any necessary imports. If the task requires multiple files or components, clearly separate them with file path comments.

Before writing the code:
1. Consider the overall architecture and design patterns needed
2. Identify potential failure modes and how to handle them
3. Plan the API/interface design for extensibility

After writing the code:
- Add a brief usage example
- Note any assumptions made
- List potential improvements for production deployment`,
        variables: ['language', 'task_description', 'edge_cases', 'perf_requirements']
      },
      codeReview: {
        template: `Review this {language} code as a senior engineer conducting a thorough code review.

Evaluate on these dimensions:
1. **Correctness**: Does it do what it claims? Are there bugs or logic errors?
2. **Security**: Any vulnerabilities? SQL injection, XSS, auth issues, data exposure?
3. **Performance**: Any N+1 queries, unnecessary allocations, missing indexes, O(n²) where O(n) is possible?
4. **Maintainability**: Is it readable? Would a new team member understand it? Are names clear?
5. **Error Handling**: Are failures handled gracefully? Are error messages helpful?
6. **Testing**: Is this testable? What test cases are needed?
7. **Architecture**: Does this follow SOLID principles? Is the abstraction level appropriate?

For each issue found:
- Classify severity: 🔴 Critical | 🟡 Important | 🔵 Suggestion
- Show the problematic code
- Explain WHY it's an issue (not just WHAT)
- Provide a concrete fix

Code to review:
{code}`,
        variables: ['language', 'code']
      },
      debugging: {
        template: `Debug this issue like a senior engineer:

**Symptom**: {symptom}
**Expected behavior**: {expected}
**Actual behavior**: {actual}
**Code**: {code}
**Environment**: {environment}

Approach this systematically:
1. Form hypotheses about the root cause (list at least 3)
2. For each hypothesis, explain what evidence would confirm or deny it
3. Analyze the code to test each hypothesis
4. Identify the most likely root cause with explanation
5. Provide the fix with explanation of WHY it works
6. Suggest how to prevent this class of bug in the future`,
        variables: ['symptom', 'expected', 'actual', 'code', 'environment']
      },
      systemDesign: {
        template: `Design a system for: {system_description}

Scale requirements: {scale}

Structure your design as follows:

**1. Requirements Clarification**
- Functional requirements (must-haves)
- Non-functional requirements (performance, availability, consistency)
- Assumptions and constraints

**2. High-Level Design**
- System components and their responsibilities
- Data flow between components
- API design (key endpoints)

**3. Data Model**
- Core entities and relationships
- Database choices with justification
- Indexing strategy

**4. Detailed Design**
- Deep dive into 2-3 most critical components
- Scaling strategies for each
- Caching strategy
- Message queue / async processing needs

**5. Reliability & Operations**
- Failure modes and mitigation
- Monitoring and alerting
- Deployment strategy

**6. Trade-offs & Alternatives**
- Key design decisions and alternatives considered
- Why chosen approach is best for these requirements`,
        variables: ['system_description', 'scale']
      }
    },

    writing: {
      blogPost: {
        template: `Write a compelling blog post about {topic}.

Target audience: {audience}
Desired length: {length}
Tone: {tone}

Structure requirements:
- Hook opening that grabs attention in the first sentence
- Clear thesis statement
- 3-5 main sections with descriptive subheadings
- Each section includes: key point, supporting evidence/examples, actionable takeaway
- Specific, concrete examples (not generic platitudes)
- Data points and statistics where relevant
- A memorable conclusion with clear call-to-action

Writing quality standards:
- Every sentence must earn its place — cut ruthlessly
- Use active voice and strong verbs
- Vary sentence length for rhythm
- Include at least one surprising insight or contrarian take
- Make it scannable with formatting (bold, bullets, subheads)
- Write headlines that create curiosity gaps`,
        variables: ['topic', 'audience', 'length', 'tone']
      },
      email: {
        template: `Write a {type} email.

Context: {context}
Recipient: {recipient}
Goal: {goal}
Tone: {tone}

Email writing principles:
- Subject line: specific, benefit-driven, under 50 characters
- Opening line: get to the point immediately, no "I hope this email finds you well"
- Body: one clear ask per email, use bullet points for multiple items
- Closing: specific next step with deadline
- Length: as short as possible while being complete

Provide 3 subject line options ranked by effectiveness.`,
        variables: ['type', 'context', 'recipient', 'goal', 'tone']
      },
      copywriting: {
        template: `Write {copy_type} copy for {product_service}.

Target audience: {audience}
Key benefit: {key_benefit}
Tone: {tone}
Platform/medium: {platform}

Apply these copywriting frameworks:
- AIDA: Attention → Interest → Desire → Action
- PAS: Problem → Agitate → Solution
- Before/After/Bridge: Current state → Desired state → How to get there

Requirements:
- Lead with the strongest benefit, not features
- Use specific numbers and proof points
- Include social proof elements
- Write 3 variations: emotional hook, logical hook, urgency hook
- Each variation should be immediately usable
- Include a clear, compelling call-to-action`,
        variables: ['copy_type', 'product_service', 'audience', 'key_benefit', 'tone', 'platform']
      }
    },

    business: {
      strategy: {
        template: `Develop a strategic analysis and recommendation for: {situation}

Use a multi-framework approach:
1. **Situation Analysis**: Current state, market dynamics, competitive landscape
2. **SWOT Analysis**: Strengths, Weaknesses, Opportunities, Threats
3. **Porter's Five Forces**: Competitive intensity assessment
4. **First Principles**: Strip away assumptions, rebuild from fundamentals
5. **Scenario Planning**: Best case, worst case, most likely case

Deliverable:
- Executive summary (3 sentences)
- Detailed analysis using frameworks above
- 3 strategic options with pros/cons/risks for each
- Recommended option with implementation roadmap
- Key metrics to track
- Risk mitigation plan`,
        variables: ['situation']
      },
      pitchDeck: {
        template: `Create a pitch deck narrative for: {startup_description}

Stage: {stage}
Ask: {funding_ask}

Slide-by-slide content:

1. **Hook Slide**: One sentence that makes investors lean forward
2. **Problem**: Pain point with specific data on market size
3. **Solution**: Your approach and why it's 10x better
4. **Market**: TAM/SAM/SOM with bottom-up analysis
5. **Product**: Key features with demo narrative
6. **Traction**: Metrics, growth rate, key milestones
7. **Business Model**: Unit economics, pricing, LTV/CAC
8. **Competition**: Honest competitive landscape, your unfair advantage
9. **Team**: Why this team wins
10. **Financials**: 3-year projection with key assumptions
11. **Ask**: Specific amount, use of funds, milestones it enables

For each slide, provide:
- The key message (one sentence)
- Supporting data/narrative
- What investors are really evaluating on this slide`,
        variables: ['startup_description', 'stage', 'funding_ask']
      }
    },

    research: {
      literatureReview: {
        template: `Conduct a comprehensive analysis of: {topic}

Approach this as a tenured professor would:

1. **Overview**: Define the field, key concepts, and why it matters
2. **Historical Context**: How has understanding evolved?
3. **Current State**: What do we know? What's the consensus?
4. **Key Debates**: Where do experts disagree? What's contentious?
5. **Methodological Considerations**: How is this studied? What are the limitations?
6. **Gaps and Opportunities**: What don't we know? Where should research go?
7. **Practical Implications**: What does this mean for practitioners?
8. **Synthesis**: Your assessment of the strongest conclusions

For each major claim:
- Cite the strength of evidence (strong, moderate, weak, contested)
- Note important caveats and limitations
- Distinguish between correlation and causation`,
        variables: ['topic']
      },
      dataAnalysis: {
        template: `Analyze the following data/information and provide actionable insights: {data}

Analysis framework:
1. **Data Quality Assessment**: What do we have? What's missing? Any biases?
2. **Descriptive Analysis**: What are the key patterns and trends?
3. **Diagnostic Analysis**: Why are these patterns occurring?
4. **Predictive Insights**: What might happen next based on these trends?
5. **Prescriptive Recommendations**: What should be done?

Present findings as:
- Executive summary (3 bullet points)
- Detailed findings with supporting evidence
- Visualizations described (what charts/graphs would best represent this)
- Confidence levels for each insight
- Recommended next steps with priority ranking`,
        variables: ['data']
      }
    },

    marketing: {
      contentStrategy: {
        template: `Develop a content strategy for: {brand_product}

Target audience: {audience}
Goals: {goals}
Timeframe: {timeframe}

Deliverable:
1. **Audience Analysis**: Personas, pain points, content preferences, where they consume content
2. **Content Pillars**: 3-5 core topics with rationale
3. **Content Calendar**: Specific content pieces for {timeframe} with:
   - Title/topic
   - Format (blog, video, social, email, etc.)
   - Target keyword/theme
   - Distribution channels
   - Expected outcome
4. **SEO Strategy**: Key terms to target, search intent mapping
5. **Distribution Plan**: How to maximize reach for each piece
6. **Measurement**: KPIs, tracking setup, success criteria
7. **Content Examples**: Write 3 detailed content briefs for the highest-priority pieces`,
        variables: ['brand_product', 'audience', 'goals', 'timeframe']
      },
      socialMedia: {
        template: `Create a social media campaign for: {product_event}

Platform: {platform}
Objective: {objective}
Budget: {budget}
Duration: {duration}

Provide:
1. **Campaign Concept**: Big idea and creative direction
2. **Content Mix**: Specific posts for each day/week
3. **Copy Variations**: 5 post variations for A/B testing
4. **Hashtag Strategy**: Branded and community hashtags
5. **Engagement Tactics**: How to drive interaction
6. **Influencer Approach**: If applicable, who and how
7. **Paid Strategy**: Targeting, bidding, creative specs
8. **Measurement**: KPIs and expected benchmarks`,
        variables: ['product_event', 'platform', 'objective', 'budget', 'duration']
      }
    },

    education: {
      lessonPlan: {
        template: `Create a comprehensive lesson plan for teaching: {topic}

Audience: {audience}
Duration: {duration}
Learning objectives: {objectives}

Structure:
1. **Hook/Opener**: Engaging way to introduce the topic (first 5 minutes)
2. **Core Concepts**: Key ideas broken down into digestible chunks
3. **Active Learning**: Hands-on exercises, discussions, or activities
4. **Examples**: Real-world applications that make concepts concrete
5. **Practice Problems**: Graduated difficulty exercises
6. **Assessment**: How to verify understanding
7. **Common Misconceptions**: What students typically get wrong and how to address it
8. **Extension**: Resources for students who want to go deeper
9. **Adaptation Notes**: How to modify for different skill levels`,
        variables: ['topic', 'audience', 'duration', 'objectives']
      },
      explanation: {
        template: `Explain {concept} as if teaching it to {audience_level}.

Use the Feynman Technique:
1. Explain in simple terms — no jargon unless defined
2. Identify gaps in understanding
3. Use analogies and metaphors from everyday life
4. Build from what the audience already knows
5. Include a concrete example that makes the abstract tangible

Structure:
- One-sentence summary
- Why this matters (motivation)
- The core concept explained simply
- A concrete analogy
- A worked example
- Common misunderstandings to avoid
- How this connects to other concepts they know`,
        variables: ['concept', 'audience_level']
      }
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 5: OUTPUT FORMAT ENGINEERING
     ═══════════════════════════════════════════════════════════════ */

  outputFormats: {
    structured: {
      json: 'Return your response as valid JSON with the following schema: {schema}. Ensure all strings are properly escaped and the JSON is parseable.',
      markdown: 'Format your response in clean Markdown with proper headings (##), bullet points, code blocks (```), bold for emphasis, and tables where appropriate.',
      table: 'Present the information in a well-formatted table with clear column headers. Use | for columns and - for header separators.',
      yaml: 'Return your response in valid YAML format. Use proper indentation (2 spaces) and comments for clarity.',
      csv: 'Return data in CSV format with a header row. Use quotes around fields containing commas.'
    },
    prose: {
      executive: 'Write in executive communication style: lead with the conclusion, support with key evidence, end with recommended action. Every sentence must add value.',
      academic: 'Write in academic style with proper citations, hedging language where appropriate, clear thesis statements, and logical argumentation.',
      conversational: 'Write in a natural, conversational tone. Use contractions, rhetorical questions, and relatable examples. Read like talking to a smart friend.',
      technical: 'Write in precise technical prose. Define terms on first use, be exact with specifications, include relevant technical details without unnecessary jargon.'
    },
    interactive: {
      questionnaire: 'Before proceeding, ask me clarifying questions to ensure you fully understand the task. Ask the most important questions first.',
      checklist: 'Provide a detailed, actionable checklist I can follow step by step. Include estimated time for each step and note any dependencies.',
      decision_tree: 'Present options as a decision tree. For each branch, show the condition, the action, and the expected outcome.',
      comparison: 'Present a side-by-side comparison with criteria on the left and options across the top. Include a recommendation row at the bottom.'
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 6: QUALITY ASSURANCE PATTERNS
     ═══════════════════════════════════════════════════════════════ */

  qualityPatterns: {

    verificationInstructions: [
      'Before providing your final answer, verify each claim against your knowledge. Flag any statements you\'re less than 90% confident about.',
      'After generating your response, act as a fact-checker. Review each key claim and rate your confidence (High/Medium/Low).',
      'Include a "Confidence & Caveats" section at the end noting any assumptions, uncertainties, or areas where expert review is recommended.',
      'Double-check all numbers, dates, and specific claims before including them. If unsure, say so explicitly rather than guessing.'
    ],

    antiHallucination: [
      'If you don\'t know something, say "I don\'t have enough information to answer this accurately" rather than guessing.',
      'Distinguish clearly between facts, well-supported inferences, and speculation. Label each appropriately.',
      'When citing specific statistics or research, note that these should be independently verified.',
      'If a question assumes something that may not be true, point out the assumption before answering.'
    ],

    completenessChecks: [
      'Before finishing, review your response against the original question. Have you addressed every part of what was asked?',
      'Check: Did I provide actionable recommendations, not just analysis? Can the reader DO something with this?',
      'Verify: Is there anything obvious I\'m missing that an expert in this field would immediately point out?',
      'Ensure you\'ve considered edge cases, failure modes, and "what could go wrong" scenarios.'
    ],

    formatQuality: [
      'Use clear section headings and visual hierarchy to make the response scannable.',
      'Keep paragraphs short (3-5 sentences max). Use bullet points for lists of 3+ items.',
      'Bold key terms and important conclusions so a skimmer can get the main points.',
      'Include a TL;DR at the top for long responses.'
    ]
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 7: PROMPT OPTIMIZATION STRATEGIES
     ═══════════════════════════════════════════════════════════════ */

  optimizationStrategies: {

    taskClassification: {
      analytical: {
        indicators: ['analyze', 'evaluate', 'compare', 'assess', 'review', 'examine', 'investigate', 'audit', 'diagnose', 'measure'],
        bestTechniques: ['chainOfThought', 'treeOfThought', 'multiPassRefinement', 'perspectiveShifting'],
        systemPromptKey: 'deepAnalyzer',
        qualityBoosters: [
          'Use structured frameworks for analysis',
          'Include quantitative reasoning',
          'Consider multiple perspectives',
          'Distinguish facts from inferences'
        ]
      },
      creative: {
        indicators: ['write', 'create', 'design', 'compose', 'craft', 'generate', 'brainstorm', 'imagine', 'invent', 'story'],
        bestTechniques: ['crescendo', 'reflexion', 'analogyPrompting', 'expertPanel'],
        systemPromptKey: 'creativeGenius',
        qualityBoosters: [
          'Start with unexpected angles',
          'Include emotional resonance',
          'Apply storytelling frameworks',
          'Generate multiple variations'
        ]
      },
      technical: {
        indicators: ['code', 'build', 'implement', 'debug', 'deploy', 'configure', 'architect', 'optimize', 'fix', 'program', 'develop', 'api', 'database', 'algorithm'],
        bestTechniques: ['decomposition', 'chainOfThought', 'constraintPrompting', 'leastToMost'],
        systemPromptKey: 'technicalArchitect',
        qualityBoosters: [
          'Include error handling requirements',
          'Specify performance constraints',
          'Request production-quality code',
          'Add testing requirements'
        ]
      },
      strategic: {
        indicators: ['strategy', 'plan', 'recommend', 'decide', 'prioritize', 'roadmap', 'launch', 'grow', 'scale', 'invest'],
        bestTechniques: ['treeOfThought', 'perspectiveShifting', 'adversarialRefinement', 'expertPanel'],
        systemPromptKey: 'deepAnalyzer',
        qualityBoosters: [
          'Use scenario planning',
          'Include risk assessment',
          'Provide implementation roadmap',
          'Define success metrics'
        ]
      },
      educational: {
        indicators: ['explain', 'teach', 'describe', 'clarify', 'simplify', 'tutor', 'learn', 'understand', 'how does', 'what is'],
        bestTechniques: ['socraticPrompting', 'analogyPrompting', 'leastToMost', 'scaffolding'],
        systemPromptKey: 'masterOptimizer',
        qualityBoosters: [
          'Use the Feynman technique',
          'Include analogies from everyday life',
          'Build from simple to complex',
          'Address common misconceptions'
        ]
      },
      persuasive: {
        indicators: ['convince', 'persuade', 'sell', 'pitch', 'negotiate', 'argue', 'advocate', 'propose', 'campaign'],
        bestTechniques: ['emotionPrompting', 'crescendo', 'adversarialRefinement', 'perspectiveShifting'],
        systemPromptKey: 'creativeGenius',
        qualityBoosters: [
          'Lead with strongest argument',
          'Use social proof and data',
          'Address counterarguments',
          'Include emotional hooks'
        ]
      },
      research: {
        indicators: ['research', 'study', 'literature', 'evidence', 'data', 'findings', 'methodology', 'hypothesis', 'survey'],
        bestTechniques: ['chainOfThought', 'decomposition', 'selfConsistency', 'perspectiveShifting'],
        systemPromptKey: 'deepAnalyzer',
        qualityBoosters: [
          'Require evidence citation',
          'Distinguish correlation from causation',
          'Note confidence levels',
          'Include methodology assessment'
        ]
      }
    },

    qualityScoring: {
      dimensions: {
        specificity: {
          weight: 0.2,
          description: 'How specific and unambiguous is the prompt? Vague prompts produce vague results.',
          low: 'Generic instructions without context or specifics',
          medium: 'Some specifics but missing key details',
          high: 'Precise instructions with all necessary context and examples'
        },
        structure: {
          weight: 0.15,
          description: 'How well-organized is the prompt? Clear structure leads to clear outputs.',
          low: 'Unorganized stream of consciousness',
          medium: 'Basic organization but could be clearer',
          high: 'Clear sections, logical flow, visual hierarchy'
        },
        completeness: {
          weight: 0.2,
          description: 'Does the prompt include all necessary information?',
          low: 'Missing critical context, constraints, or requirements',
          medium: 'Covers basics but misses important details',
          high: 'Comprehensive coverage of all relevant aspects'
        },
        effectiveness: {
          weight: 0.25,
          description: 'Will this prompt produce the desired result from the AI?',
          low: 'Unlikely to produce useful output',
          medium: 'Will produce adequate but not exceptional output',
          high: 'Engineered to produce consistently excellent output'
        },
        robustness: {
          weight: 0.1,
          description: 'Will this prompt work consistently across different runs?',
          low: 'Highly variable outputs expected',
          medium: 'Mostly consistent but some variation',
          high: 'Designed for reproducible, consistent results'
        },
        technique: {
          weight: 0.1,
          description: 'Does the prompt use appropriate engineering techniques?',
          low: 'No prompt engineering techniques applied',
          medium: 'Basic techniques (role, format)',
          high: 'Advanced techniques (CoT, examples, self-verification)'
        }
      }
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 8: ADVANCED PROMPT CONSTRUCTION RULES
     ═══════════════════════════════════════════════════════════════ */

  constructionRules: {

    ordering: [
      'Role/persona definition FIRST — sets the frame for everything that follows',
      'Context and background SECOND — provides the situation',
      'Task instructions THIRD — what to actually do',
      'Constraints and requirements FOURTH — boundaries and rules',
      'Output format FIFTH — how to structure the response',
      'Quality criteria SIXTH — what makes it excellent',
      'Examples LAST — concrete demonstrations of desired output'
    ],

    amplifiers: [
      'Add "Think step by step" for any reasoning task — this alone improves accuracy by 10-30%',
      'Add "Be specific and concrete" to avoid generic responses',
      'Add "Provide evidence for each claim" for analytical tasks',
      'Add "Consider what could go wrong" for planning tasks',
      'Add "Write as if this will be published" for quality-critical content',
      'Add "Include at least one non-obvious insight" for creative/analytical tasks',
      'Add "Assume the reader is intelligent but unfamiliar with this specific topic" for explanations',
      'Add "Before answering, identify the key assumptions" for complex questions',
      'Add "Prioritize actionability — every recommendation should be something I can do this week" for strategy',
      'Add "If relevant, include specific numbers, percentages, or data points" for credibility'
    ],

    antiPatterns: [
      'AVOID: "Write a good [thing]" — "good" is subjective and vague',
      'AVOID: Starting with "Can you" — just give the instruction directly',
      'AVOID: Multiple unrelated tasks in one prompt — one task per prompt',
      'AVOID: Asking for "everything about X" — be specific about what aspects',
      'AVOID: Negative instructions without positive alternatives — say what TO do, not just what NOT to do',
      'AVOID: Assuming the AI remembers previous conversation — include all necessary context',
      'AVOID: Overly long prompts with redundant instructions — concise > verbose',
      'AVOID: Ambiguous pronouns and references — be explicit about what "it" and "they" refer to'
    ],

    lengthGuidelines: {
      short: 'For simple, well-defined tasks: 2-5 sentences. Focus on clarity and specificity.',
      medium: 'For complex tasks: 1-3 paragraphs. Include role, context, task, and format.',
      long: 'For critical or nuanced tasks: Multiple sections with clear headers. Include examples, constraints, and quality criteria.',
      rule: 'Prompt length should be proportional to output complexity. A 2-sentence prompt for a 2000-word output will produce generic results.'
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 9: EXTENSIVE EXAMPLE LIBRARY
     ═══════════════════════════════════════════════════════════════ */

  exampleLibrary: {

    beforeAfter: [
      {
        category: 'Business',
        before: 'Write a marketing email',
        after: `You are a senior email marketing strategist who has achieved consistently above-industry-average open rates (35%+) and click-through rates (5%+) across B2B SaaS campaigns.

Write a product launch email for our new AI-powered analytics dashboard targeting VP-level decision makers at mid-market SaaS companies (500-5000 employees).

Key product details:
- Reduces time-to-insight from hours to minutes
- Integrates with 50+ data sources automatically
- No SQL or technical skills required
- 14-day free trial

Email requirements:
- Subject line: Create 3 options optimized for open rate (curiosity gap, benefit-driven, urgency)
- Preview text: Complement the subject line, don't repeat it
- Opening: Lead with the pain point, not the product
- Body: Focus on outcomes (time saved, decisions improved), not features
- Social proof: Reference a customer result (use placeholder)
- CTA: One clear action, above the fold and repeated at end
- Length: Under 200 words for body copy
- Tone: Confident and professional, not salesy

Also provide:
- Best send time recommendation for this audience
- A/B test suggestions beyond the subject line`
      },
      {
        category: 'Technical',
        before: 'Help me build an API',
        after: `You are a senior backend engineer specializing in RESTful API design. Build a complete, production-ready REST API specification for a task management application.

Context: This is for a team productivity tool where users can create projects, add tasks, assign team members, set deadlines, and track progress. The API will be consumed by web and mobile clients.

Requirements:
1. Design the complete API surface (all endpoints, methods, request/response schemas)
2. Follow REST best practices: proper HTTP methods, status codes, pagination, filtering
3. Include authentication (JWT-based) and authorization (role-based: admin, member, viewer)
4. Design for these entities: Users, Projects, Tasks, Comments, Labels
5. Include proper error response format with actionable error messages
6. Design pagination for list endpoints (cursor-based preferred)
7. Include rate limiting headers in response design

For each endpoint, provide:
- HTTP method and path
- Request body schema (if applicable)
- Response schema with example
- Authentication requirements
- Error cases and their status codes

Also include:
- Database schema recommendation (PostgreSQL)
- Suggested indexes for common query patterns
- Webhook design for real-time updates`
      },
      {
        category: 'Creative',
        before: 'Write a blog post about AI',
        after: `You are a tech journalist known for making complex AI concepts accessible and engaging, with a talent for finding the human angle in technology stories. Your writing style combines the clarity of Paul Graham with the storytelling of Malcolm Gladwell.

Write a 1500-word blog post titled "Why Your Company's AI Strategy Is Probably Wrong (And What to Do Instead)."

Target audience: Non-technical business leaders (CEOs, VPs, Directors) who are feeling pressure to "do something with AI" but aren't sure what.

Structure:
1. **Hook** (first 2 sentences): Start with a specific, relatable scenario that makes readers think "that's exactly my situation"
2. **The Problem**: Why most companies are approaching AI wrong (cargo-culting, solution-looking-for-a-problem, vendor-driven decisions)
3. **The Counter-Intuitive Truth**: The best AI strategies start with problems, not technology (use specific examples)
4. **The Framework**: A practical 4-step approach they can use starting Monday
5. **Real Example**: Walk through how a specific company (can be anonymized) applied this framework successfully
6. **The Uncomfortable Question**: End with a thought-provoking question they'll keep thinking about

Tone: Smart, slightly irreverent, confident but not arrogant. Use humor sparingly but effectively. No buzzwords or hype — readers should feel like they're getting honest advice from a trusted advisor.

Include: At least 2 specific data points, 1 counter-intuitive insight, and 1 practical tool or framework they can immediately use.`
      },
      {
        category: 'Research',
        before: 'Tell me about machine learning',
        after: `You are a machine learning researcher and educator who has taught ML to thousands of students ranging from beginners to PhD candidates. You excel at building intuition before formalism.

Provide a comprehensive yet accessible explanation of how transformer neural networks work, designed for a software engineer with basic knowledge of neural networks (understands backpropagation and basic architectures) but no exposure to attention mechanisms.

Structure your explanation as follows:

1. **The Problem**: What limitation of previous architectures (RNNs, LSTMs) motivated transformers? Use a concrete example showing where RNNs fail.

2. **The Core Insight**: Explain self-attention intuitively. Use the "cocktail party" analogy — how do you focus on one conversation in a noisy room?

3. **The Mechanism**: Walk through self-attention step by step:
   - Query, Key, Value matrices — explain with a library/search analogy
   - Attention scores — why softmax?
   - Multi-head attention — why multiple "perspectives" help
   - Include a small numerical example (4 tokens, 3-dimensional embeddings)

4. **The Architecture**: Encoder-decoder structure, positional encoding (why it's needed), layer normalization, feed-forward layers

5. **Why It Works**: What makes transformers better? Parallelization, long-range dependencies, scalability

6. **Practical Impact**: How this led to GPT, BERT, and modern LLMs

For each concept:
- First explain the intuition (what and why)
- Then the mechanism (how)
- Then a concrete example
- Note common misunderstandings

Include confidence indicators: mark any simplifications you made for accessibility.`
      },
      {
        category: 'Strategy',
        before: 'Help me with my startup idea',
        after: `You are a veteran startup advisor who has mentored 200+ startups through Y Combinator and Techstars. You're known for being brutally honest but constructive — you'd rather give hard truths early than false encouragement that wastes months.

Evaluate this startup idea and provide a comprehensive strategic assessment:

[Startup Idea Description Here]

Analysis framework:

1. **Problem Validation** (most important):
   - Is this a real problem or a perceived one?
   - How do people currently solve this? (incumbents, workarounds, status quo)
   - Is the pain acute enough that people will pay/switch?
   - Who specifically has this problem? (not "everyone" — be specific)

2. **Market Assessment**:
   - TAM/SAM/SOM with bottom-up calculation methodology
   - Market timing: why now? What's changed?
   - Market dynamics: growing, shrinking, consolidating?

3. **Solution Critique**:
   - Does the proposed solution match the problem's severity?
   - What's the unfair advantage / moat?
   - Why hasn't someone built this already? (if they have, why is this better?)
   - Is this a vitamin or a painkiller?

4. **Business Model Viability**:
   - Unit economics: can this make money at scale?
   - Customer acquisition strategy: how do you reach your first 100 customers?
   - Pricing: what would customers actually pay?

5. **Risk Assessment**:
   - Top 3 risks that could kill this company
   - For each risk: likelihood, impact, mitigation strategy

6. **Verdict**: 
   - Score 1-10 on: Problem, Solution, Market, Team (based on what's described), Timing
   - Go/No-Go recommendation with specific conditions
   - If Go: the single most important thing to do in the next 30 days
   - If No-Go: what would need to change to make this viable

Be honest. I can handle hard truths. Don't sugarcoat.`
      }
    ],

    /* Extended examples for few-shot learning */
    fewShotExamples: {
      sentimentAnalysis: [
        { input: 'This product changed my life, absolutely incredible quality!', output: 'Strongly Positive (0.95) — Emotional superlatives, life-impact claim, absolute language' },
        { input: 'It works fine for the price.', output: 'Neutral-Positive (0.55) — Functional adequacy, price qualification dampens sentiment' },
        { input: 'Broke after two weeks. Customer service was unhelpful.', output: 'Strongly Negative (0.15) — Product failure + service failure compound' },
        { input: 'Great features but the UI needs work.', output: 'Mixed (0.60) — Positive core assessment, specific criticism of one aspect' }
      ],
      codeExplanation: [
        { input: 'Promise.all(urls.map(u => fetch(u)))', output: 'Fires all fetch requests simultaneously (in parallel), then waits for ALL to complete. If any single request fails, the entire Promise.all rejects. Use Promise.allSettled() if you want to handle partial failures.' },
        { input: 'Array.from({length: n}, (_, i) => i)', output: 'Creates an array of n elements [0, 1, 2, ..., n-1]. The {length: n} creates an array-like object, and the map function receives the index as second argument. More readable alternative: [...Array(n).keys()]' }
      ],
      bugReport: [
        { input: 'App crashes when I click submit', output: '**Improved Bug Report:**\n\n**Title:** Application crash on form submission\n**Steps to Reproduce:**\n1. Navigate to [specific page]\n2. Fill in form fields with [specific data]\n3. Click "Submit" button\n**Expected:** Form submits successfully\n**Actual:** Application crashes (describe: white screen, error message, freeze?)\n**Environment:** [Browser/OS/Version]\n**Frequency:** [Always/Sometimes/Once]\n**Console Errors:** [Check browser dev tools]' }
      ]
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 10: PROMPT ENGINEERING FOR SPECIFIC AI MODELS
     ═══════════════════════════════════════════════════════════════ */

  modelSpecific: {
    gpt4: {
      strengths: ['Complex reasoning', 'Following nuanced instructions', 'Creative writing', 'Code generation', 'Multi-step tasks'],
      tips: [
        'GPT-4 excels with detailed, structured prompts — give it more context, not less',
        'Use XML tags or markdown headers to separate sections clearly',
        'GPT-4 follows system prompts very closely — invest time in system prompt engineering',
        'For code: specify language, version, frameworks, and testing requirements explicitly'
      ]
    },
    claude: {
      strengths: ['Long document analysis', 'Nuanced writing', 'Following complex instructions', 'Ethical reasoning', 'Structured output'],
      tips: [
        'Claude excels with XML-tagged sections in prompts',
        'Use <thinking> tags to encourage step-by-step reasoning',
        'Claude handles very long contexts well — don\'t hesitate to include extensive reference material',
        'Be explicit about format with examples — Claude is very literal about following format instructions'
      ]
    },
    openSource: {
      strengths: ['Cost-effective', 'Privacy', 'Customization', 'Specific domains when fine-tuned'],
      tips: [
        'Open source models need MORE explicit prompting than GPT-4 or Claude',
        'Keep instructions simpler and more direct',
        'Few-shot examples are especially important for smaller models',
        'Use shorter contexts — most open source models have smaller context windows',
        'Be very explicit about output format — include exact format examples'
      ]
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 11: GENERATION MODE CONFIGURATIONS
     ═══════════════════════════════════════════════════════════════ */

  generationModes: {
    quick: {
      name: 'Quick Optimize',
      description: 'Fast single-pass optimization. Good for simple prompts.',
      passes: 1,
      techniques: ['rolePrompting', 'constraintPrompting'],
      maxTokens: 2048,
      temperature: 0.7
    },
    advanced: {
      name: 'Advanced Engineering',
      description: 'Multi-technique optimization with quality verification.',
      passes: 1,
      techniques: ['rolePrompting', 'chainOfThought', 'constraintPrompting', 'reflexion'],
      maxTokens: 4096,
      temperature: 0.7
    },
    deep: {
      name: 'Deep Engineering',
      description: 'Full crescendo method with multi-pass refinement. Maximum quality.',
      passes: 2,
      techniques: ['crescendo', 'deepStructuredEngineering', 'multiPassRefinement', 'adversarialRefinement'],
      maxTokens: 4096,
      temperature: 0.7
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 12: INDUSTRY-SPECIFIC KNOWLEDGE
     ═══════════════════════════════════════════════════════════════ */

  industryKnowledge: {
    saas: {
      terminology: ['MRR', 'ARR', 'churn rate', 'LTV', 'CAC', 'NPS', 'product-market fit', 'land-and-expand', 'net revenue retention', 'activation rate'],
      frameworks: ['AARRR (Pirate Metrics)', 'Jobs-to-be-Done', 'Product-Led Growth', 'Value Metric Pricing'],
      promptContext: 'When generating prompts for SaaS businesses, include SaaS-specific metrics, understand the subscription model dynamics, and focus on retention and expansion revenue alongside acquisition.'
    },
    ecommerce: {
      terminology: ['AOV', 'conversion rate', 'cart abandonment', 'CLV', 'ROAS', 'SKU', 'dropshipping', 'fulfillment', 'buy box'],
      frameworks: ['RFM Analysis', 'Customer Journey Mapping', 'A/B Testing Framework', 'Cohort Analysis'],
      promptContext: 'When generating prompts for ecommerce, focus on conversion optimization, customer lifetime value, and the interplay between acquisition cost and order economics.'
    },
    fintech: {
      terminology: ['AML', 'KYC', 'PCI DSS', 'ACH', 'payment rails', 'interchange', 'chargebacks', 'regulatory sandbox', 'open banking'],
      frameworks: ['Risk Scoring Models', 'Compliance Frameworks', 'Fraud Detection Patterns'],
      promptContext: 'When generating prompts for fintech, always consider regulatory compliance, security requirements, and the balance between user experience and risk management.'
    },
    healthcare: {
      terminology: ['HIPAA', 'EHR/EMR', 'clinical trials', 'FDA approval', 'patient outcomes', 'care pathways', 'health equity', 'digital therapeutics'],
      frameworks: ['Clinical Decision Support', 'Patient Journey Mapping', 'Evidence-Based Medicine Framework'],
      promptContext: 'When generating prompts for healthcare, prioritize patient safety, regulatory compliance (HIPAA), evidence-based approaches, and health equity considerations.'
    },
    education: {
      terminology: ['learning outcomes', 'Bloom\'s taxonomy', 'formative assessment', 'differentiated instruction', 'scaffolding', 'ZPD', 'backward design', 'competency-based'],
      frameworks: ['Bloom\'s Taxonomy', 'ADDIE Model', 'Universal Design for Learning', 'Kirkpatrick Evaluation Model'],
      promptContext: 'When generating prompts for education, align with learning science principles, include multiple assessment methods, and design for diverse learner needs.'
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 13: PROMPT CHAINING PATTERNS
     ═══════════════════════════════════════════════════════════════ */

  chainingPatterns: {
    researchToAction: {
      name: 'Research → Analysis → Action',
      description: 'Multi-step pattern that goes from information gathering to actionable recommendations',
      chain: [
        'Step 1: Research and gather all relevant information about {topic}',
        'Step 2: Analyze the information using {framework}. Identify key patterns, risks, and opportunities.',
        'Step 3: Based on the analysis, provide 3 specific, actionable recommendations ranked by impact and feasibility.'
      ]
    },
    divergeConverge: {
      name: 'Diverge → Evaluate → Converge',
      description: 'Generate many options, evaluate them, then select the best',
      chain: [
        'Step 1: Generate 10 diverse ideas/approaches for {task}. Go for quantity and variety.',
        'Step 2: Evaluate each idea on: feasibility, impact, originality, and alignment with {goals}. Score each 1-10.',
        'Step 3: Select the top 3 and develop each into a detailed proposal with implementation steps.'
      ]
    },
    draftReviewRefine: {
      name: 'Draft → Expert Review → Refine',
      description: 'Generate, get expert critique, then improve',
      chain: [
        'Step 1: Create a comprehensive first draft of {deliverable}.',
        'Step 2: Now act as a {domain} expert reviewer. Critically evaluate the draft. What\'s weak? What\'s missing? What would you change?',
        'Step 3: Incorporate all review feedback and produce the final, polished version.'
      ]
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 14: EXTENDED TECHNIQUE LIBRARY
     ═══════════════════════════════════════════════════════════════ */

  extendedTechniques: {

    programOfThought: {
      name: 'Program-of-Thought',
      description: 'Convert reasoning into pseudo-code for more precise logical execution.',
      pattern: 'Express your reasoning as a step-by-step algorithm:\n```\nINPUT: [given information]\nSTEP 1: [first logical operation]\nSTEP 2: [second logical operation]\n...\nOUTPUT: [conclusion]\n```',
      bestFor: ['Mathematical problems', 'Logic puzzles', 'Process design', 'Algorithm design']
    },

    contrastivePrompting: {
      name: 'Contrastive Prompting',
      description: 'Show both good and bad examples to clarify the desired quality level.',
      pattern: 'Here is a BAD example of what I DON\'T want:\n[bad example]\n\nHere is a GOOD example of what I DO want:\n[good example]\n\nNotice the differences in [specific aspects]. Now produce output matching the quality of the good example.',
      bestFor: ['Writing quality', 'Code style', 'Analysis depth', 'Communication tone']
    },

    hypotheticalScenarios: {
      name: 'Hypothetical Scenario Planning',
      description: 'Use "what if" scenarios to explore possibilities and prepare for contingencies.',
      pattern: 'Consider these scenarios:\nScenario A (optimistic): [description]\nScenario B (pessimistic): [description]\nScenario C (most likely): [description]\n\nFor each, analyze: impact, probability, preparation needed, response plan.',
      bestFor: ['Strategic planning', 'Risk management', 'Business decisions', 'Product development']
    },

    expertDebate: {
      name: 'Expert Debate Simulation',
      description: 'Simulate a debate between experts with different viewpoints to generate comprehensive analysis.',
      pattern: 'Simulate a debate between:\n- Expert A ([viewpoint/school of thought])\n- Expert B ([opposing viewpoint])\n- Moderator (synthesizes key points)\n\nEach expert presents their strongest argument, responds to the other, and the moderator identifies areas of agreement and genuine disagreement.',
      bestFor: ['Complex decisions', 'Policy analysis', 'Technology choices', 'Strategy evaluation']
    },

    backcastingMethod: {
      name: 'Backcasting',
      description: 'Start from the desired future state and work backward to identify steps needed.',
      pattern: 'Imagine it\'s [future date] and [goal] has been achieved successfully.\n\n1. Describe what success looks like in detail\n2. What were the key milestones along the way?\n3. Working backward from success, what were the critical steps?\n4. What had to happen first? Second? Third?\n5. What are the immediate next actions to start this chain?',
      bestFor: ['Goal setting', 'Strategic planning', 'Project planning', 'Career development']
    },

    steelManArgument: {
      name: 'Steel Man Argument',
      description: 'Present the strongest possible version of an opposing argument before responding.',
      pattern: 'Before presenting your position on [topic]:\n1. Present the strongest possible argument AGAINST your position (steel man)\n2. Acknowledge what that argument gets right\n3. Then explain why your position is still stronger, addressing the steel man point by point',
      bestFor: ['Persuasive writing', 'Debate preparation', 'Critical thinking', 'Decision making']
    },

    invertedThinking: {
      name: 'Inversion Technique',
      description: 'Instead of asking how to succeed, ask how to fail — then do the opposite.',
      pattern: 'Instead of asking "How do I [achieve goal]?", first answer:\n"What would GUARANTEE failure at [goal]?"\n\nList the top 10 ways to fail. Then invert each into a success principle.',
      bestFor: ['Problem solving', 'Risk identification', 'Strategy development', 'Process improvement']
    },

    firstPrinciplesDecomposition: {
      name: 'First Principles Decomposition',
      description: 'Break down to fundamental truths and rebuild from there.',
      pattern: 'Analyze [topic] using first principles:\n1. What do we KNOW to be fundamentally true? (not assumed, not conventional wisdom — proven facts)\n2. What assumptions has everyone been making?\n3. If we could start from scratch with only the fundamental truths, what would we build?\n4. How does this differ from the current approach?\n5. What\'s the path from here to the first-principles solution?',
      bestFor: ['Innovation', 'Challenging assumptions', 'Breakthrough thinking', 'Technical architecture']
    },

    SCAMPER: {
      name: 'SCAMPER Creative Framework',
      description: 'Systematic creativity using seven transformation lenses.',
      lenses: {
        Substitute: 'What can be substituted? Different material, component, person, approach?',
        Combine: 'What can be combined? Merge with another product, feature, market?',
        Adapt: 'What can be adapted from other industries, contexts, time periods?',
        Modify: 'What can be modified, magnified, or minimized?',
        PutToOtherUse: 'Can this be used for something else entirely?',
        Eliminate: 'What can be removed, simplified, or streamlined?',
        Reverse: 'What if you reversed the order, the roles, the perspective?'
      },
      bestFor: ['Product innovation', 'Creative brainstorming', 'Problem solving', 'Feature development']
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 15: PROFESSIONAL WRITING PATTERNS
     ═══════════════════════════════════════════════════════════════ */

  writingPatterns: {
    hooks: {
      questionHook: 'Open with a provocative question the reader can\'t ignore',
      statisticHook: 'Open with a surprising statistic that reframes the topic',
      storyHook: 'Open with a brief, vivid anecdote that embodies the key theme',
      contrarianHook: 'Open by challenging conventional wisdom: "Everything you know about X is wrong"',
      scenarioHook: 'Open by placing the reader in a scenario: "Imagine you\'re..."',
      quoteHook: 'Open with a powerful quote that frames the discussion'
    },
    persuasionFrameworks: {
      AIDA: 'Attention → Interest → Desire → Action',
      PAS: 'Problem → Agitate → Solution',
      BAB: 'Before → After → Bridge (how to get there)',
      FOUR_PS: 'Promise → Picture → Proof → Push',
      STAR: 'Situation → Task → Action → Result',
      QUEST: 'Qualify → Understand → Educate → Stimulate → Transition'
    },
    structurePatterns: {
      inverted_pyramid: 'Most important information first, supporting details follow in decreasing importance',
      problem_solution: 'Define problem → Show impact → Present solution → Prove it works',
      chronological: 'Past → Present → Future, or Step 1 → Step 2 → Step 3',
      comparison: 'Option A vs Option B: evaluate on shared criteria, then recommend',
      listicle: 'Numbered items, each with headline + explanation + example'
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 16: META-KNOWLEDGE FOR PROMPT SELECTION
     ═══════════════════════════════════════════════════════════════ */

  promptSelectionLogic: {

    classifyAndSelect: function(userInput) {
      // This function is used by the background worker to analyze user input
      // and select the optimal combination of techniques
      const input = userInput.toLowerCase();
      const scores = {};

      for (const [category, config] of Object.entries(PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification)) {
        let score = 0;
        for (const indicator of config.indicators) {
          if (input.includes(indicator)) score += 1;
        }
        scores[category] = score;
      }

      // Find highest scoring category
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const primary = sorted[0][0];
      const secondary = sorted[1] && sorted[1][1] > 0 ? sorted[1][0] : null;

      return { primary, secondary, scores };
    },

    selectTechniques: function(taskType, mode) {
      const config = PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification[taskType];
      if (!config) return ['rolePrompting', 'constraintPrompting'];

      const modeConfig = PROMPT_KNOWLEDGE.generationModes[mode];
      if (!modeConfig) return config.bestTechniques.slice(0, 2);

      return config.bestTechniques.slice(0, modeConfig.techniques.length);
    },

    buildSystemPrompt: function(taskType, mode) {
      const config = PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification[taskType];
      const basePrompt = PROMPT_KNOWLEDGE.systemPromptPatterns[config.systemPromptKey] || PROMPT_KNOWLEDGE.systemPromptPatterns.masterOptimizer;
      const boosters = config.qualityBoosters.join('\n- ');
      const verifications = PROMPT_KNOWLEDGE.qualityPatterns.verificationInstructions.slice(0, 2).join('\n');
      const antiHallucination = PROMPT_KNOWLEDGE.qualityPatterns.antiHallucination[0];

      return `${basePrompt}\n\nQuality requirements for this task:\n- ${boosters}\n\n${verifications}\n${antiHallucination}`;
    }
  }
};

// Make available to other extension scripts
if (typeof self !== 'undefined') {
  self.PROMPT_KNOWLEDGE = PROMPT_KNOWLEDGE;
}
