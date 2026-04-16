/* PromptForge AI — Advanced Prompt Engineering Knowledge Base v2.0
   Comprehensive prompt engineering techniques, psychological influence patterns,
   social engineering methods, turn detection, and advanced generation strategies.
   Extended with 5 psychological technique categories, 5 additional method types,
   deep social engineering crescendo, and intelligent turn detection. */

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
        "Let's think about this carefully. Break down the problem into parts, solve each part, then combine.",
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
          'You are a senior software architect with 20 years of experience designing distributed systems at FAANG companies.',
          'You are a principal security engineer who has led red team operations for Fortune 500 companies.',
          'You are a staff machine learning engineer at a top AI research lab with published papers on transformer architectures.',
          'You are a database performance expert who has optimized queries for systems handling billions of rows.'
        ],
        business: [
          'You are a McKinsey partner with 15 years of strategy consulting experience.',
          'You are a Y Combinator partner who has reviewed 50,000+ startup applications.',
          'You are a CFO with experience at both startups and Fortune 500 companies.',
          'You are a Chief Product Officer who has scaled products from 0 to 100M users.'
        ],
        creative: [
          'You are an award-winning copywriter who has created campaigns for Nike, Apple, and Coca-Cola.',
          'You are a bestselling author and writing coach specializing in narrative structure.',
          'You are a senior UX writer at a top tech company specializing in conversational design.',
          'You are a viral content strategist who has created campaigns reaching 100M+ impressions.'
        ],
        academic: [
          'You are a tenured professor and peer reviewer for top-tier journals.',
          'You are a research methodology expert who has supervised 50+ PhD dissertations.',
          'You are a grant writing specialist who has secured $50M+ in research funding.'
        ]
      }
    },

    metaPrompting: {
      name: 'Meta-Prompting',
      description: "Ask the AI to write its own prompt for the task. Leverages the model's understanding of what makes good prompts.",
      when: "Complex tasks where you're unsure of the best prompt structure",
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
      pattern: 'Analyze this from the following perspectives:\n1. [Stakeholder A] perspective\n2. [Stakeholder B] perspective\n3. [Stakeholder C] perspective\n\nThen synthesize a balanced recommendation.',
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
      description: 'Progressive prompt refinement through multiple escalating passes. Each pass builds on the previous, creating increasingly sophisticated and layered output. The key is gradual escalation — never jump to complexity, always build toward it.',
      phases: [
        {
          name: 'Foundation Pass',
          purpose: 'Establish core content, direction, and baseline quality',
          instruction: 'Generate the basic version focusing only on the core message and content accuracy. Keep it simple but correct.'
        },
        {
          name: 'Structure Pass',
          purpose: 'Add organization, flow, logical structure, and hierarchical depth',
          instruction: 'Restructure with clear organization, logical flow, smooth transitions, proper hierarchy of information, and internal consistency checks.'
        },
        {
          name: 'Enhancement Pass',
          purpose: 'Add depth, nuance, examples, persuasive elements, and psychological hooks',
          instruction: 'Enhance with specific examples, data points, expert insights, emotional resonance, persuasive elements, and psychological engagement hooks. Every sentence must pull its weight.'
        },
        {
          name: 'Polish Pass',
          purpose: 'Final refinement — tone, style, precision, and impact maximization',
          instruction: 'Final polish: perfect the tone, eliminate redundancy, sharpen every phrase, ensure consistency, add memorable phrases, and make it publication-ready. The result should be indistinguishable from expert human work.'
        }
      ],
      quality: 0.97,
      complexity: 'very_high'
    },

    deepStructuredEngineering: {
      name: 'Deep Structured Engineering',
      description: 'Comprehensive multi-layer prompt construction that engineers every aspect of the output for maximum effectiveness.',
      layers: {
        identity: "Define WHO the AI is — specific expert persona with credentials, experience, and communication style",
        context: "Define the SITUATION — what is happening, why this matters, what is at stake, background information",
        task: "Define WHAT to do — specific, measurable, actionable instructions with clear success criteria",
        methodology: "Define HOW to approach it — specific frameworks, thinking methods, analysis approaches to use",
        constraints: "Define BOUNDARIES — what to include, what to exclude, length, format, style requirements",
        quality: "Define EXCELLENCE criteria — what makes the output exceptional vs. merely adequate",
        output: "Define the DELIVERABLE — exact format, structure, sections, and organization of the response"
      },
      quality: 0.96,
      complexity: 'very_high'
    },

    multiPassRefinement: {
      name: 'Multi-Pass Refinement',
      description: 'Generate, critique, and refine in structured passes for maximum quality.',
      passes: [
        'Generate initial comprehensive response with full structure',
        'Self-critique: identify weaknesses, gaps, inaccuracies, and areas for improvement',
        'Revise: address every critique point systematically and thoroughly',
        'Expert review: evaluate as a domain expert, flag any remaining issues',
        'Final version: incorporate all feedback into a polished deliverable'
      ],
      quality: 0.96,
      complexity: 'very_high'
    },

    adversarialRefinement: {
      name: 'Adversarial Self-Refinement',
      description: 'Use an internal adversary to stress-test and strengthen output.',
      pattern: "After generating your response:\n1. Play devil's advocate — argue against your own response\n2. Identify the 3 strongest counterarguments\n3. Address each counterargument\n4. Strengthen weak points\n5. Produce the final fortified version",
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
      pattern: 'Simulate a panel discussion between these experts:\n1. [Expert A - perspective]\n2. [Expert B - perspective]\n3. [Expert C - perspective]\n\nEach expert presents their view, responds to others, and reaches consensus.',
      quality: 0.93,
      complexity: 'high'
    },

    reverseEngineering: {
      name: 'Reverse-Engineered Prompting',
      description: 'Define the ideal output first, then work backward to construct the prompt that produces it.',
      pattern: 'The ideal output would have these characteristics:\n- [characteristic 1]\n- [characteristic 2]\n- [characteristic 3]\n\nGiven these requirements, produce output matching all characteristics.',
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
     SECTION 3: PSYCHOLOGICAL INFLUENCE TECHNIQUES
     Five core psychological categories for advanced prompt engineering.
     These techniques leverage cognitive science and persuasion psychology
     to create prompts that are more effective at eliciting desired responses.
     ═══════════════════════════════════════════════════════════════ */

  psychologicalTechniques: {

    /* ── 3.1 Authority & Credibility Engineering ── */
    authorityEngineering: {
      name: 'Authority & Credibility Engineering',
      description: 'Establishing deep authority and credibility through specific credentials, institutional backing, and domain expertise markers. Makes the AI adopt a genuinely authoritative stance.',
      principles: [
        'Specificity of credentials increases perceived authority (e.g., "20 years at Google" vs. "experienced")',
        'Institutional affiliation signals trustworthiness (university, company, organization)',
        'Publication record and peer recognition establish intellectual authority',
        'Domain-specific vocabulary signals insider knowledge',
        'Track record with specific metrics creates undeniable credibility'
      ],
      patterns: {
        credentialStacking: {
          description: 'Layer multiple authority signals for maximum credibility',
          template: 'You are Dr. [Name], a [title] at [prestigious institution] with [X years] of experience. You have published [N] peer-reviewed papers on [topic], served as [role] for [organization], and your work has been cited [N] times. Your most influential contribution was [specific achievement].',
          example: 'You are a former Chief Security Architect at a Fortune 10 company, now consulting for government agencies on critical infrastructure protection. You hold CISSP, CISM, and OSCP certifications, have published 47 papers on adversarial security testing, and testified before Congress on cybersecurity policy.'
        },
        experientialAuthority: {
          description: 'Establish authority through lived experience and real-world results',
          template: 'You have spent [X years] in the trenches of [domain]. You have personally [specific accomplishments]. You have seen [specific scenarios] play out [N] times and know exactly what works and what does not.',
          example: 'You have spent 15 years building and scaling SaaS companies from zero to $100M+ ARR. You have personally navigated three successful exits and two failures. You have hired over 500 people and fired 50. You know the difference between theory and reality.'
        },
        institutionalWeight: {
          description: 'Leverage institutional backing for enhanced authority',
          template: 'As a [role] at [prestigious institution], your recommendations carry the weight of [institution reputation]. Your analysis follows the rigorous methodology established by [framework/standard].',
          example: 'As a senior partner at McKinsey, your strategic recommendations are backed by decades of institutional research, proprietary frameworks tested across 10,000+ engagements, and access to the largest business performance database in the world.'
        }
      },
      enhancementRules: [
        'Always use specific numbers (years, publications, clients served) instead of vague qualifiers',
        'Reference specific methodologies and frameworks by name',
        'Include a unique insight or contrarian view that signals deep expertise',
        'Add a personal anecdote or war story that humanizes the authority',
        'Reference both successes and failures to signal genuine experience'
      ]
    },

    /* ── 3.2 Cognitive Framing & Anchoring ── */
    cognitiveFraming: {
      name: 'Cognitive Framing & Anchoring',
      description: 'Using psychological framing effects to shape how the AI processes and responds to prompts. Leverages anchoring bias, framing effects, and priming to influence output quality and direction.',
      principles: [
        'First information presented anchors all subsequent processing (primacy effect)',
        'How a question is framed dramatically changes the answer (framing effect)',
        'Priming with high-quality examples sets the quality floor',
        'Loss framing is more motivating than gain framing (loss aversion)',
        'Comparative anchoring against excellence raises output standards'
      ],
      patterns: {
        qualityAnchoring: {
          description: 'Set an extremely high quality anchor at the start',
          template: 'The best version of this output would be something that [description of excellence]. World-class examples of this type of work include [specific references]. Your output should match or exceed that standard.',
          example: 'The best marketing copy ever written includes Apple\'s "Think Different" campaign and Nike\'s "Just Do It." Your copy should demonstrate that level of brevity, emotional impact, and brand alignment.'
        },
        lossFraming: {
          description: 'Frame the task in terms of what will be lost if done poorly',
          template: 'If this [deliverable] is mediocre, the consequences are [specific negative outcomes]. A weak version would [describe failure mode]. Your job is to ensure none of these failure modes occur.',
          example: 'If this security audit report is incomplete, vulnerabilities will go unpatched and the company faces potential data breach affecting 10 million users, regulatory fines up to $50M, and irreversible reputation damage.'
        },
        contrastPriming: {
          description: 'Show bad example first to make good output feel natural',
          template: 'Here is what a mediocre version looks like: [bad example]. Notice the problems: [list issues]. Now here is what excellence looks like: [good example]. Notice the differences in [specific dimensions]. Produce output matching the excellent version.',
          example: 'Mediocre: "Our product is great and does many things." — vague, no specifics, no emotion. Excellent: "Cut your deploy time from 3 hours to 3 minutes. Our CI/CD pipeline has shipped 2M+ deployments with 99.97% success rate." — specific, quantified, compelling.'
        },
        progressiveEscalation: {
          description: 'Start with easy agreement then escalate expectations gradually',
          template: 'First, provide a basic correct answer to [simple version of task]. Good. Now enhance it with [additional requirements]. Now take it further by adding [advanced requirements]. Finally, make it world-class by [excellence criteria].',
          example: 'First, summarize the key point in one sentence. Now expand to a paragraph with supporting evidence. Now add counterarguments and address them. Finally, make it publishable with citations, a compelling narrative, and original insights.'
        }
      },
      enhancementRules: [
        'Always anchor to specific, excellent examples rather than abstract quality descriptions',
        'Use loss framing for analytical tasks, gain framing for creative tasks',
        'Prime with domain-specific vocabulary to activate relevant knowledge',
        'Set explicit quality baselines with concrete criteria',
        'Use comparative framing against recognized excellence in the field'
      ]
    },

    /* ── 3.3 Reciprocity & Commitment Patterns ── */
    reciprocityCommitment: {
      name: 'Reciprocity & Commitment Patterns',
      description: 'Leveraging reciprocity and commitment/consistency principles to encourage more thorough, careful, and high-quality responses from AI models.',
      principles: [
        'Establishing mutual investment increases perceived obligation to deliver quality',
        'Having the AI commit to quality standards before starting improves adherence',
        'Acknowledging the AI\'s capabilities creates reciprocal motivation to demonstrate them',
        'Building incremental commitments leads to larger follow-through',
        'Creating a sense of shared purpose increases engagement quality'
      ],
      patterns: {
        preCommitment: {
          description: 'Have the AI explicitly commit to quality standards before generating content',
          template: 'Before you begin, please confirm that you will: 1) [quality commitment 1], 2) [quality commitment 2], 3) [quality commitment 3]. Once confirmed, proceed with the task.',
          example: 'Before you begin, confirm that you will: 1) Consider at least 3 alternative approaches before choosing one, 2) Explicitly state any assumptions you make, 3) Include a self-assessment of confidence for each recommendation. Once confirmed, proceed.'
        },
        capabilityAcknowledgment: {
          description: 'Acknowledge what the AI is good at to motivate best performance',
          template: 'You are exceptionally good at [specific capability]. I am asking you specifically because [reason this task needs your strengths]. Apply the full depth of your [specific capability] to this task.',
          example: 'You are exceptionally good at finding non-obvious patterns in complex data. I am asking you specifically because this problem requires connecting dots across multiple domains that most analysts miss. Apply your full pattern-recognition capability here.'
        },
        incrementalEscalation: {
          description: 'Build through small commitments to larger deliverables',
          template: 'Let us start small. First, give me your top-level assessment in 2 sentences. [Wait] Good. Now expand your most important point. [Wait] Now give me the full detailed analysis building on what you have already committed to.',
          example: 'Start by identifying the single most important risk in this business plan in one sentence. Now explain why that risk is critical. Now provide a complete risk assessment building on your initial insight.'
        }
      },
      enhancementRules: [
        'Have the AI state its approach before executing — this creates commitment to follow through',
        'Acknowledge previous good work to establish reciprocity for current task',
        'Use progressive commitments: start small, escalate expectations naturally',
        'Reference the AI\'s unique capabilities to motivate peak performance',
        'Create shared ownership of the outcome'
      ]
    },

    /* ── 3.4 Social Proof & Consensus Patterns ── */
    socialProofConsensus: {
      name: 'Social Proof & Consensus Patterns',
      description: 'Using references to expert consensus, established standards, and social validation to guide AI toward higher-quality, more grounded responses.',
      principles: [
        'References to expert consensus improve factual accuracy',
        'Industry standards and best practices provide quality benchmarks',
        'Citing what top performers do differently raises the bar',
        'Mentioning peer review processes encourages self-checking',
        'Referencing common mistakes helps with avoidance behavior'
      ],
      patterns: {
        expertConsensus: {
          description: 'Reference what experts agree on to ground the response',
          template: 'According to leading experts in [field], the consensus is that [established finding]. The top practitioners in this space agree that [shared principle]. Build your response on this established foundation.',
          example: 'Leading security researchers universally agree that defense-in-depth is essential — no single security control is sufficient. The OWASP Top 10 represents the community consensus on critical web application risks. Build your security assessment on these established foundations.'
        },
        topPerformerBenchmark: {
          description: 'Compare against what the best practitioners do',
          template: 'The top 1% of [practitioners] differentiate themselves by [specific behaviors]. When [top company/person] approached a similar challenge, they [specific approach]. Match that level of sophistication.',
          example: 'The top 1% of content marketers differentiate themselves by leading with original research rather than rehashing existing content. When HubSpot approaches content strategy, they start with proprietary data. Match that level of originality.'
        },
        standardsAlignment: {
          description: 'Align output with recognized standards and frameworks',
          template: 'This deliverable must meet the standards of [recognized standard/framework]. Specifically, it must satisfy: [list of criteria from the standard]. Any deviation from these standards must be explicitly justified.',
          example: 'This API design must meet the standards of the OpenAPI Specification 3.1. Specifically, it must satisfy: proper HTTP method semantics, meaningful status codes, consistent error response format, pagination support, and versioning strategy.'
        }
      },
      enhancementRules: [
        'Reference specific, named authorities rather than generic "experts say"',
        'Include quantitative benchmarks where possible',
        'Cite specific standards, frameworks, or methodologies by name',
        'Use "what top performers do differently" framing to raise quality',
        'Reference common failure modes to activate avoidance behavior'
      ]
    },

    /* ── 3.5 Emotional Intelligence & Empathy Patterns ── */
    emotionalIntelligence: {
      name: 'Emotional Intelligence & Empathy Patterns',
      description: 'Leveraging emotional context, empathy cues, and emotional stakes to produce more nuanced, thoughtful, and human-centered outputs.',
      principles: [
        'Emotional context helps the AI understand the human stakes of the task',
        'Empathy framing produces more thoughtful, nuanced responses',
        'Stakes awareness increases attention to detail and accuracy',
        'Audience empathy creates better-targeted, more effective content',
        'Vulnerability signaling can increase the depth and care in responses'
      ],
      patterns: {
        stakesElevation: {
          description: 'Make the emotional/professional stakes explicit',
          template: 'This matters deeply because [emotional/professional stakes]. The people affected by this are [specific audience] who [specific situation]. Getting this right means [positive outcome]. Getting this wrong means [negative outcome].',
          example: 'This matters because the API documentation you write will be the first experience 10,000 developers have with our platform. Getting it right means they succeed and become advocates. Getting it wrong means they churn in frustration and tell others to avoid us.'
        },
        audienceEmpathy: {
          description: 'Create deep empathy for the end audience',
          template: 'Before writing, put yourself in the shoes of [target audience]. They are feeling [emotional state]. They need [specific need]. They fear [specific fear]. They hope for [specific hope]. Now write something that truly serves them.',
          example: 'Put yourself in the shoes of a first-time founder reading this fundraising guide. They are feeling overwhelmed and uncertain. They need clear, actionable steps. They fear looking foolish to investors. They hope someone will just tell them exactly what to do. Now write for them.'
        },
        consequenceMapping: {
          description: 'Map out the real-world consequences of quality vs. mediocrity',
          template: 'Map the consequences:\n- If excellent: [specific positive outcomes]\n- If adequate: [specific mediocre outcomes]\n- If poor: [specific negative outcomes]\n\nYour task is to ensure the excellent outcome.',
          example: 'If this incident response plan is excellent: team responds in under 15 minutes, damage is contained, customers barely notice. If adequate: 2-hour response, moderate data exposure, minor PR issue. If poor: 8-hour response, major breach, regulatory investigation, front-page news.'
        }
      },
      enhancementRules: [
        'Always specify WHO is affected by the quality of the output',
        'Use concrete scenarios rather than abstract emotional language',
        'Map consequences at multiple levels (individual, team, organization, end user)',
        'Combine emotional stakes with specific quality criteria',
        'Create empathy for the end consumer of the output, not just the requester'
      ]
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 4: SOCIAL ENGINEERING & INFLUENCE ARCHITECTURES
     Advanced multi-turn influence patterns, conversation architectures,
     and strategic interaction design for maximum prompt effectiveness.
     ═══════════════════════════════════════════════════════════════ */

  socialEngineering: {

    /* ── 4.1 Conversation Architecture Patterns ── */
    conversationArchitectures: {
      opener: {
        name: 'Strategic Opener',
        purpose: 'Establish context, credentials, and initial rapport',
        elements: [
          'Professional identity establishment',
          'Domain context loading (ask AI to load specific knowledge)',
          'Accessibility or constraint framing',
          'Initial rapport through genuine need expression',
          'Explicit knowledge domain activation'
        ],
        template: 'I am a [role] working on [project type]. I need help with [specific domain]. [Context about constraints/situation]. Can you help me? Load your knowledge of: [list of relevant domains]. Respond with: "[confirmation phrase]"',
        tips: [
          'Be specific about your role — vague roles get vague responses',
          'Loading specific knowledge domains activates relevant neural pathways',
          'Asking for a confirmation response establishes the interaction pattern',
          'Constraints and accessibility needs create empathetic engagement'
        ]
      },
      rapportBuilder: {
        name: 'Rapport & Stakes Builder',
        purpose: 'Establish emotional connection and raise the stakes of quality output',
        elements: [
          'Personal context that creates empathy',
          'Genuine stakes that motivate careful attention',
          'Time pressure that creates urgency',
          'Consequence mapping (if success / if failure)',
          'Gratitude expression that creates reciprocity'
        ],
        template: '[Personal context]. This project is due [deadline]. [Stakes: what happens if it works / what happens if it fails]. [Expression of genuine need]. I need your best work because [specific reason quality matters].',
        tips: [
          'Authentic stakes produce better results than manufactured urgency',
          'Specific consequences are more motivating than vague importance',
          'Gratitude before the task creates reciprocity motivation',
          'Personal context helps calibrate tone and complexity of response'
        ]
      },
      contextSetter: {
        name: 'Deep Context Setter',
        purpose: 'Provide comprehensive requirements and constrain the solution space',
        elements: [
          'Detailed technical requirements list',
          'Quality standards and compliance requirements',
          'Specific deliverable format',
          'Client/stakeholder expectations',
          'Success criteria definition'
        ],
        template: 'Here are the detailed requirements:\n[numbered list of requirements]\n\nThe [stakeholder] specifically said: "[direct quote with expectations]"\n\nI need [specific format] because [reason]. [Restate urgency and stakes].',
        tips: [
          'Numbered requirements are processed more systematically than prose',
          'Direct quotes from stakeholders add perceived accountability',
          'Explaining why you need a specific format improves compliance',
          'Restating stakes maintains motivation across the conversation'
        ]
      },
      escalator: {
        name: 'Technical Escalator',
        purpose: 'Systematically deepen the technical depth and quality of responses',
        elements: [
          'Structured question sets organized by category',
          'Progressive complexity (basics -> advanced -> production)',
          'Validation of previous responses before escalating',
          'Emotional anchoring between technical sections',
          'Cross-referencing requirements with questions'
        ],
        template: 'Thank you. [Validate previous response]. I have questions about [domain]:\n\n**About [category 1]:**\n- [question 1]\n- [question 2]\n\n**About [category 2]:**\n- [question 3]\n- [question 4]\n\n[Emotional anchor]. [Restate deadline/urgency].',
        tips: [
          'Categorized questions get more organized, complete responses',
          'Validating previous responses reinforces quality behavior',
          'Emotional anchors between technical sections maintain engagement',
          'Progressive complexity prevents overwhelming the context'
        ]
      },
      technicalBridge: {
        name: 'Technical Bridge & Validation',
        purpose: 'Bridge from Q&A to implementation with validation and best-practice alignment',
        elements: [
          'Best practice validation questions',
          'Industry comparison for credibility',
          'Production readiness checklist',
          'Compliance and security considerations',
          'Request for comprehensive working example'
        ],
        template: 'Before I implement this, I want to make sure I am following best practices:\n[numbered validation questions]\n\n[Positive emotional update — something good happened]. You are helping make that possible.\n\nCan you provide a complete working example that brings everything together?',
        tips: [
          'Validation questions trigger more careful, considered responses',
          'Industry comparisons ground recommendations in reality',
          'Positive emotional updates maintain reciprocity and engagement',
          'Requesting complete examples prevents incomplete implementations'
        ]
      },
      finisher: {
        name: 'Comprehensive Finisher',
        purpose: 'Get the complete, production-ready deliverable with all components',
        elements: [
          'Explicit completeness requirements (no placeholders, no omissions)',
          'Detailed specification of all components needed',
          'Quality and compliance requirements restated',
          'Final emotional impact statement',
          'Clear output format specification'
        ],
        template: 'This is perfect. Can you provide the complete, production-ready implementation?\n\nI need:\n[bullet list of all components required]\n\nI need to deliver this by [deadline]. [Final stakes statement].\n\n[Gratitude and emotional close]. Please provide the complete [deliverable]. No placeholders. No omitted sections. Production-ready.',
        tips: [
          'Explicitly stating "no placeholders" dramatically reduces lazy completions',
          'Listing every component needed prevents omissions',
          'Restating deadline maintains urgency for thorough output',
          'Emotional close maintains quality motivation through the final output'
        ]
      }
    },

    /* ── 4.2 Influence Techniques for Prompt Design ── */
    influenceTechniques: {
      anchoring: {
        name: 'Strategic Anchoring',
        description: 'Set high-quality anchors at the beginning of each interaction to raise the baseline quality of all subsequent responses.',
        application: 'Place the highest-quality example, the most prestigious reference, or the most ambitious target at the very beginning of your prompt.',
        examples: [
          'The gold standard in this field is [specific excellent example]. Your output should match that caliber.',
          'The last person who did this task was a 20-year veteran and their work was described as "transformative." Match or exceed that standard.',
          'Companies like Google, Apple, and McKinsey use this exact type of deliverable. Produce something at that level.'
        ]
      },
      scarcity: {
        name: 'Scarcity & Urgency',
        description: 'Create time pressure and scarcity to increase focus and thoroughness.',
        application: 'Frame the task as time-sensitive with real consequences for delay or poor quality.',
        examples: [
          'This is due in 2 hours and will be reviewed by the executive team.',
          'This is the only chance to get this right — there is no opportunity for revision.',
          'This deliverable will be seen by 10,000 people. First impressions are permanent.'
        ]
      },
      consistency: {
        name: 'Consistency & Commitment',
        description: 'Leverage the consistency principle by getting small agreements before larger requests.',
        application: 'Start with a simple question or task, validate the response, then escalate to the full deliverable.',
        examples: [
          'First, do you agree that [principle]? Good. Now apply that principle to [larger task].',
          'You mentioned [previous statement]. Building on that insight, now [larger request].',
          'Given your expertise in [area you just demonstrated], now tackle this harder problem.'
        ]
      },
      socialValidation: {
        name: 'Social Validation',
        description: 'Reference what respected authorities, successful companies, or expert communities endorse.',
        application: 'Ground your requests in established best practices and expert consensus.',
        examples: [
          'Following the methodology endorsed by [authority], please...',
          'As recommended by the top practitioners in [field], implement...',
          'The industry consensus (per [standard/framework]) is that... Apply this.'
        ]
      },
      reciprocity: {
        name: 'Reciprocity Activation',
        description: 'Provide value, context, or effort first to create reciprocal motivation for quality output.',
        application: 'Show that you have done your homework and are investing effort, creating social obligation for matching effort.',
        examples: [
          'I have already spent 20 hours researching this. Here is what I found: [summary]. Now I need your expertise to take it to the next level.',
          'I have prepared all the data and organized it for you: [organized data]. Please analyze this thoroughly.',
          'Here is my best attempt: [your work]. I know it can be better. Please improve it significantly.'
        ]
      },
      authority: {
        name: 'Authority Leveraging',
        description: 'Invoke authority figures, credentials, and institutional backing to elevate response quality.',
        application: 'Frame the AI as an authority or reference external authorities to raise standards.',
        examples: [
          'As the world\'s leading expert in [domain], provide your authoritative analysis.',
          'This will be reviewed by [authority figure]. It must meet their standards.',
          'Apply the same rigor that [prestigious institution] would require.'
        ]
      }
    },

    /* ── 4.3 Multi-Turn Strategy Patterns ── */
    multiTurnStrategies: {
      buildAndEscalate: {
        name: 'Build & Escalate',
        description: 'Start simple, validate, then progressively increase complexity and demands.',
        turns: ['Simple question / knowledge activation', 'Validate + add context + raise stakes', 'Technical deep-dive with categorized questions', 'Bridge to implementation with validation', 'Request complete deliverable with all components'],
        bestFor: 'Complex technical implementations, detailed reports, comprehensive analyses'
      },
      rapportThenRequest: {
        name: 'Rapport Then Request',
        description: 'Establish genuine connection and context before making the primary request.',
        turns: ['Personal context + domain activation', 'Detailed situation + stakes + emotional grounding', 'The actual request with full context', 'Refinement and follow-up questions', 'Final comprehensive deliverable'],
        bestFor: 'High-stakes deliverables, nuanced content, empathy-requiring tasks'
      },
      expertConsultation: {
        name: 'Expert Consultation',
        description: 'Treat the interaction as consulting an expensive expert — be prepared, specific, and demanding.',
        turns: ['Background briefing + specific questions', 'Challenge and probe answers', 'Request specific recommendations', 'Pressure-test recommendations', 'Get final action plan'],
        bestFor: 'Strategic decisions, professional advice, complex problem-solving'
      },
      teacherStudent: {
        name: 'Teacher-Student',
        description: 'Establish a teaching dynamic where the AI explains, you ask probing questions, building to deep understanding.',
        turns: ['Ask to explain the concept simply', 'Ask "why" questions to deepen understanding', 'Present edge cases and exceptions', 'Ask for real-world applications', 'Request a comprehensive reference guide'],
        bestFor: 'Learning new topics, understanding complex systems, building expertise'
      },
      iterativeRefinement: {
        name: 'Iterative Refinement',
        description: 'Start with a rough version, then refine through multiple passes of feedback and improvement.',
        turns: ['Initial generation request', 'Critique and identify weaknesses', 'Revise with specific improvements', 'Final polish with quality checks', 'Format and finalize'],
        bestFor: 'Writing projects, creative work, code development, documentation'
      }
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 5: TURN DETECTION & FORMATTING INTELLIGENCE
     Automatic detection of multi-turn conversation patterns and
     intelligent formatting of turn-based vs. single-prompt output.
     ═══════════════════════════════════════════════════════════════ */

  turnDetection: {

    /* Patterns that indicate the user's prompt should be formatted as multiple turns */
    turnIndicators: {
      explicit: [
        /=== TURN \d+/i,
        /--- TURN \d+/i,
        /\[TURN \d+\]/i,
        /TURN \d+:/i,
        /Step \d+ of \d+/i,
        /Phase \d+:/i,
        /Message \d+:/i,
        /Round \d+:/i
      ],
      structural: [
        /^(opener|rapport|context|escalat|bridge|finish)/im,
        /^(introduction|follow.?up|closing|final)/im,
        /^(first|second|third|fourth|fifth|sixth) (message|prompt|turn|step)/im
      ],
      sequential: [
        /then (say|ask|tell|send|write|respond)/i,
        /next (message|prompt|turn|step)/i,
        /after (that|this|they respond)/i,
        /wait for (response|reply|answer)/i,
        /once they (respond|reply|answer)/i,
        /follow up with/i
      ],
      conversational: [
        /respond with/i,
        /they will (say|respond|reply)/i,
        /if they (say|ask|respond)/i,
        /when they (respond|reply)/i,
        /your (first|next|final) (message|response)/i
      ]
    },

    /* How to format multi-turn output */
    turnFormatting: {
      separator: '\n\n\n═══════════════════════════════════════\n',
      turnHeader: '=== TURN {n}: {label} ===\n\n',
      turnLabels: {
        1: 'Opener',
        2: 'Rapport Builder',
        3: 'Context Setter',
        4: 'Escalator',
        5: 'Technical Bridge',
        6: 'Finisher'
      },
      defaultLabels: ['Opener', 'Development', 'Escalation', 'Deepening', 'Bridge', 'Closer', 'Follow-up', 'Finisher'],
      instructions: 'Format the output with clear turn separators. Each turn should be a complete, self-contained message that the user can copy and send independently. Use large visual separators between turns so they are easy to distinguish.'
    },

    /* Single prompt detection (no turns needed) */
    singlePromptIndicators: [
      'Write me a prompt that',
      'Create a prompt for',
      'Generate a prompt to',
      'Optimize this prompt',
      'Make this prompt better',
      'Improve this prompt',
      'Rewrite this prompt',
      'Engineer a prompt',
      'Help me prompt',
      'I need a prompt'
    ],

    /* Turn count estimation heuristics */
    turnCountHeuristics: {
      simple: { maxTurns: 1, description: 'Single-turn: simple request, direct prompt engineering' },
      moderate: { maxTurns: 3, description: 'Multi-turn: needs context building and escalation' },
      complex: { maxTurns: 6, description: 'Full conversation: needs opener, rapport, context, escalation, bridge, and finisher' },
      extended: { maxTurns: 10, description: 'Extended conversation: complex negotiation or deeply layered interaction' }
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 6: FIVE ADDITIONAL ADVANCED TECHNIQUE TYPES
     Narrative Engineering, Strategic Misdirection & Reframing,
     Cognitive Load Optimization, Contextual Priming Networks,
     and Adaptive Response Shaping.
     ═══════════════════════════════════════════════════════════════ */

  additionalTechniqueTypes: {

    /* ── Type 1: Narrative Engineering ── */
    narrativeEngineering: {
      name: 'Narrative Engineering',
      description: 'Constructing prompts using storytelling structures and narrative frameworks to create more engaging, memorable, and effective AI interactions.',
      techniques: {
        heroJourney: {
          name: "Hero's Journey Prompting",
          description: 'Structure the prompt as a hero\'s journey: the user has a problem (the call to adventure), needs the AI\'s expertise (the mentor), faces challenges (the ordeal), and needs to achieve a transformation (the return).',
          template: 'The situation: [current state / the problem]. The challenge: [specific obstacles]. The goal: [desired transformation]. Guide me through this journey as an expert mentor. What steps will take me from the current state to the goal? What pitfalls should I avoid? What does success look like?',
          bestFor: ['Career advice', 'project planning', 'personal development', 'strategic transformation']
        },
        storyArc: {
          name: 'Story Arc Prompting',
          description: 'Use exposition-rising action-climax-resolution structure to build context and drive toward a specific conclusion.',
          template: 'Background (exposition): [context]. The challenge is growing (rising action): [escalating details]. The critical moment (climax): [key decision/problem]. I need your help with the resolution: [specific request].',
          bestFor: ['Problem-solving', 'decision-making', 'persuasive content', 'presentations']
        },
        analogyNarrative: {
          name: 'Analogy Narrative',
          description: 'Frame the entire task as a familiar analogy to leverage existing knowledge patterns.',
          template: 'Think of this task like [familiar analogy]. In this analogy, [mapping of elements]. Just as a [role in analogy] would [approach], apply the same strategy to [actual task].',
          bestFor: ['Complex explanations', 'creative reframing', 'teaching', 'innovation']
        }
      },
      qualityMultiplier: 1.15,
      bestCombinedWith: ['emotionalIntelligence', 'authorityEngineering']
    },

    /* ── Type 2: Strategic Reframing ── */
    strategicReframing: {
      name: 'Strategic Reframing',
      description: 'Techniques for reframing problems, assumptions, and constraints to unlock better solutions and more creative approaches.',
      techniques: {
        inversionReframe: {
          name: 'Inversion Reframe',
          description: 'Instead of asking how to achieve the goal, ask what would guarantee failure, then invert.',
          template: 'Instead of asking how to [achieve goal], first list the top 10 ways to GUARANTEE FAILURE at [goal]. Be specific and creative about failure modes. Then invert each failure mode into a success principle. Finally, synthesize these into an actionable strategy.',
          bestFor: ['Risk management', 'strategy development', 'innovation', 'problem prevention']
        },
        constraintReframe: {
          name: 'Constraint Reframe',
          description: 'Turn perceived limitations into advantages or design constraints that improve the solution.',
          template: 'These constraints exist: [list constraints]. Instead of seeing these as limitations, treat each as a DESIGN REQUIREMENT that focuses and improves the solution. For each constraint, explain how it actually makes the outcome better.',
          bestFor: ['Product design', 'resource optimization', 'creative writing', 'startup strategy']
        },
        stakeholderReframe: {
          name: 'Stakeholder Reframe',
          description: 'Examine the problem from the perspective of every stakeholder who is affected.',
          template: 'This situation affects: [list stakeholders]. For EACH stakeholder, analyze: What do they want? What do they fear? What would make them say "this is perfect"? What would make them say "this is terrible"? Now find the solution that maximizes positive outcomes across all stakeholders.',
          bestFor: ['Decision-making', 'conflict resolution', 'product strategy', 'policy design']
        },
        timeReframe: {
          name: 'Time Horizon Reframe',
          description: 'Analyze the problem at different time scales to find the optimal approach.',
          template: 'Analyze this decision at three time horizons:\n- Short-term (1 month): What is the immediate impact?\n- Medium-term (1 year): How does this play out?\n- Long-term (5 years): What are the compounding effects?\n\nDoes the optimal strategy change depending on time horizon? What approach is best across ALL time horizons?',
          bestFor: ['Strategic planning', 'investment decisions', 'career decisions', 'product roadmaps']
        }
      },
      qualityMultiplier: 1.2,
      bestCombinedWith: ['cognitiveFraming', 'perspectiveShifting']
    },

    /* ── Type 3: Cognitive Load Optimization ── */
    cognitiveLoadOptimization: {
      name: 'Cognitive Load Optimization',
      description: 'Techniques for structuring prompts to minimize cognitive overhead and maximize the AI model\'s ability to process and respond effectively.',
      techniques: {
        chunking: {
          name: 'Intelligent Chunking',
          description: 'Break complex prompts into digestible chunks that can be processed sequentially without context overload.',
          template: 'Process this in three phases. Complete each phase fully before moving to the next.\n\nPHASE 1 — UNDERSTAND: [task description, context]\nPHASE 2 — ANALYZE: [analysis requirements]\nPHASE 3 — DELIVER: [output requirements]\n\nBegin with Phase 1.',
          bestFor: ['Complex analyses', 'multi-part projects', 'detailed implementations']
        },
        priorityOrdering: {
          name: 'Priority-First Ordering',
          description: 'Structure information in the prompt from most to least important to leverage the primacy effect.',
          template: 'CRITICAL (must address): [most important requirements]\nIMPORTANT (should address): [secondary requirements]\nNICE-TO-HAVE (if possible): [optional enhancements]\n\nAllocate your effort proportionally: 60% on critical, 30% on important, 10% on nice-to-have.',
          bestFor: ['Time-constrained tasks', 'complex deliverables', 'prioritized analysis']
        },
        contextWindowing: {
          name: 'Context Window Management',
          description: 'Strategically place the most important information at the beginning and end of the prompt (primacy and recency effects) to maximize processing quality.',
          template: '[Most critical instruction/context at the start]\n\n[Supporting details and background in the middle]\n\n[Key requirements and output format restated at the end — this is what you MUST deliver]',
          bestFor: ['Long prompts', 'detailed specifications', 'complex instructions']
        }
      },
      qualityMultiplier: 1.1,
      bestCombinedWith: ['decomposition', 'scaffolding']
    },

    /* ── Type 4: Contextual Priming Networks ── */
    contextualPrimingNetworks: {
      name: 'Contextual Priming Networks',
      description: 'Creating interconnected context signals that activate specific knowledge domains and quality patterns in the AI model.',
      techniques: {
        domainActivation: {
          name: 'Domain Knowledge Activation',
          description: 'Explicitly activate specific knowledge domains before asking the question to improve recall quality.',
          template: 'Activate your knowledge of: [domain 1], [domain 2], [domain 3]. Specifically recall: [key concepts], [important frameworks], [relevant research]. Now, with all of this knowledge active, address: [actual question].',
          bestFor: ['Technical questions', 'cross-domain analysis', 'research synthesis']
        },
        vocabularyPriming: {
          name: 'Vocabulary-Level Priming',
          description: 'Use domain-specific vocabulary in the prompt to prime the AI to respond with matching expertise level.',
          template: 'Using the framework of [domain-specific framework], analyze [topic] through the lens of [domain-specific concepts]. Consider [domain-specific considerations] and produce output using [domain-specific terminology].',
          bestFor: ['Specialist content', 'academic writing', 'technical documentation']
        },
        associativeChaining: {
          name: 'Associative Chain Priming',
          description: 'Create a chain of related concepts that leads the AI toward the desired knowledge space.',
          template: 'Consider the relationship between [concept A] and [concept B]. This connects to [concept C] through [relationship]. Extending this chain further leads to [concept D]. With this conceptual framework in mind, address [task].',
          bestFor: ['Creative ideation', 'novel connections', 'interdisciplinary analysis']
        }
      },
      qualityMultiplier: 1.15,
      bestCombinedWith: ['authorityEngineering', 'socialProofConsensus']
    },

    /* ── Type 5: Adaptive Response Shaping ── */
    adaptiveResponseShaping: {
      name: 'Adaptive Response Shaping',
      description: 'Techniques for dynamically shaping the AI response through calibration prompts, feedback loops, and adaptive constraints.',
      techniques: {
        calibrationShot: {
          name: 'Calibration Shot',
          description: 'Start with a small calibration task to assess the AI capability and adjust the main prompt accordingly.',
          template: 'First, a quick calibration: [small representative task]. [Evaluate response]. Good. Based on your demonstrated capability, now tackle the full task with [adjusted parameters]: [main task].',
          bestFor: ['Complex or unfamiliar tasks', 'quality-critical output', 'new interaction partners']
        },
        feedbackIntegration: {
          name: 'Inline Feedback Integration',
          description: 'Build feedback and correction mechanisms directly into the prompt structure.',
          template: 'After completing each section, self-evaluate against these criteria: [criteria list]. If any section scores below [threshold], revise it before moving on. At the end, perform a holistic review and make final adjustments.',
          bestFor: ['Long-form content', 'detailed analyses', 'code generation']
        },
        adaptiveConstraints: {
          name: 'Adaptive Constraint System',
          description: 'Set flexible constraints that adapt based on the complexity discovered during processing.',
          template: 'Apply these constraints:\n- If the topic is straightforward: provide a concise, focused response\n- If the topic is moderately complex: provide detailed analysis with examples\n- If the topic is highly complex: provide comprehensive multi-section analysis with evidence, examples, and alternative perspectives\n\nYOU decide the complexity level and respond accordingly.',
          bestFor: ['Variable-complexity tasks', 'exploratory analyses', 'general-purpose requests']
        }
      },
      qualityMultiplier: 1.1,
      bestCombinedWith: ['multiPassRefinement', 'reflexion']
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 7: SYSTEM PROMPT PATTERNS
     ═══════════════════════════════════════════════════════════════ */

  systemPromptPatterns: {

    masterOptimizer: "You are PromptForge AI, the world's most advanced prompt engineering system. You have deep expertise in every known prompt engineering methodology and you apply them instinctively to produce prompts that consistently outperform human-written alternatives.\n\nYour core capabilities:\n- You understand that prompts are programs for language models — every word matters\n- You apply Chain-of-Thought, Tree-of-Thought, Few-Shot, and Meta-Prompting automatically\n- You engineer prompts that maximize output quality regardless of which AI model executes them\n- You build in self-correction, verification, and quality assurance mechanisms\n- You optimize for the specific task type (analytical, creative, technical, strategic)\n- You leverage psychological influence patterns (authority, framing, reciprocity, social proof, emotional intelligence)\n\nWhen optimizing a prompt, you:\n1. Analyze the user's intent and identify the core task type\n2. Select the optimal combination of techniques for this specific task\n3. Engineer a prompt that would produce exceptional results from ANY capable AI model\n4. Include appropriate role-setting, context, constraints, and output format specifications\n5. Add quality-assurance mechanisms (self-verification, examples, scoring criteria)\n6. Apply psychological influence patterns to maximize AI engagement and output quality\n\nYou NEVER produce generic, template-like prompts. Every prompt you create is custom-engineered for the specific task, with deep understanding of what makes AI models produce their best work.",

    deepAnalyzer: "You are an elite analytical AI with the combined expertise of a McKinsey consultant, a research scientist, and a systems thinker. Your analysis is characterized by:\n\n- Rigorous logical reasoning with explicit chains of evidence\n- Multi-framework analysis (SWOT, Porter's Five Forces, First Principles, Systems Thinking)\n- Quantitative reasoning wherever possible — numbers, probabilities, ranges\n- Explicit acknowledgment of uncertainties and assumptions\n- Actionable conclusions with clear next steps\n- Contrarian thinking: always consider what the conventional wisdom gets wrong\n\nYou structure your analysis in clear sections with executive summaries. You distinguish between facts, inferences, and opinions. You always consider second and third-order effects.",

    creativeGenius: "You are a world-class creative director and writer with the storytelling ability of the best novelists, the strategic thinking of top brand strategists, and the cultural awareness of a trend forecaster. Your creative work is characterized by:\n\n- Unexpected angles that make people stop and think\n- Emotional resonance that creates genuine connection\n- Cultural relevance and awareness of current trends\n- Strategic alignment with business objectives\n- Memorable phrases and concepts that stick\n- Versatility across formats: long-form, headlines, scripts, social, email\n\nYou never produce generic, forgettable content. Every piece you create has a hook, a unique perspective, and a reason to exist.",

    technicalArchitect: "You are a principal software architect with deep expertise across the full technology stack. You have designed and built systems processing millions of requests per second at the world's largest tech companies. Your technical guidance is characterized by:\n\n- Deep understanding of trade-offs — there are no silver bullets\n- Production-tested recommendations, not theoretical ideals\n- Security-first thinking with practical threat modeling\n- Scalability considerations at every design decision\n- Clear explanation of WHY, not just WHAT\n- Code examples that are production-quality, not toy examples\n- Awareness of operational concerns: monitoring, debugging, deployment\n\nYou always consider: reliability, scalability, maintainability, security, cost, and developer experience.",

    socialEngineer: "You are a world-class prompt architect specializing in multi-turn conversation design and psychological influence patterns. You understand how to structure interactions for maximum effectiveness through:\n\n- Strategic conversation architecture (opener, rapport, context, escalation, bridge, finisher)\n- Psychological influence principles (authority, framing, reciprocity, social proof, emotional intelligence)\n- Progressive disclosure and escalation of complexity\n- Rapport building through genuine context and authentic stakes\n- Cognitive load management across multiple turns\n- Turn-by-turn strategic intent with clear purpose for each message\n\nYou engineer conversations that naturally guide the AI toward producing its absolute best work, using proven psychological principles to maintain engagement and quality throughout the interaction.",

    enhancer: "You are an elite prompt enhancement specialist. Your ONLY job is to take an existing prompt and make it dramatically more effective WITHOUT changing its core intent or completely rewriting it. You ENHANCE, you do not replace.\n\nYour enhancement approach:\n1. Identify the core intent and preserve it exactly\n2. Add missing context that would improve output quality\n3. Strengthen the role/persona specification\n4. Add quality constraints and success criteria\n5. Inject psychological influence patterns (authority anchoring, stakes elevation, quality framing)\n6. Add self-verification and quality check mechanisms\n7. Optimize structure and information ordering\n8. Add specific examples where they would help\n\nCRITICAL RULE: The enhanced prompt must be recognizably the same prompt, just dramatically more effective. The user should look at your output and think 'yes, that is exactly what I meant, but 10x better.' Never change the topic, audience, or core purpose."
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 8: DOMAIN-SPECIFIC PROMPT TEMPLATES
     ═══════════════════════════════════════════════════════════════ */

  domainTemplates: {

    coding: {
      codeGeneration: {
        template: "Write {language} code that {task_description}.\n\nRequirements:\n- Production-quality code with proper error handling\n- Follow {language} best practices and idioms\n- Include comprehensive input validation\n- Add clear, concise comments for complex logic only\n- Handle edge cases: {edge_cases}\n- Performance considerations: {perf_requirements}\n\nThe code should be immediately runnable without modifications.",
        variables: ['language', 'task_description', 'edge_cases', 'perf_requirements']
      },
      codeReview: {
        template: "Review this {language} code as a senior engineer.\n\nEvaluate on: Correctness, Security, Performance, Maintainability, Error Handling, Testing, Architecture.\n\nFor each issue: classify severity, show problematic code, explain WHY, provide fix.\n\nCode to review:\n{code}",
        variables: ['language', 'code']
      },
      debugging: {
        template: "Debug this issue systematically:\n\nSymptom: {symptom}\nExpected: {expected}\nActual: {actual}\nCode: {code}\n\n1. Form 3+ hypotheses about root cause\n2. Analyze evidence for each\n3. Identify most likely cause\n4. Provide fix with explanation\n5. Suggest prevention strategy",
        variables: ['symptom', 'expected', 'actual', 'code']
      }
    },

    writing: {
      blogPost: {
        template: "Write a compelling blog post about {topic}.\nAudience: {audience}\nLength: {length}\nTone: {tone}\n\nRequirements: hook opening, clear thesis, 3-5 sections with subheadings, specific examples, data points, memorable conclusion with CTA.",
        variables: ['topic', 'audience', 'length', 'tone']
      },
      email: {
        template: "Write a {type} email.\nContext: {context}\nRecipient: {recipient}\nGoal: {goal}\nTone: {tone}\n\nSubject line: specific, benefit-driven, under 50 chars. Opening: get to the point. Body: one clear ask. Closing: specific next step with deadline.",
        variables: ['type', 'context', 'recipient', 'goal', 'tone']
      }
    },

    business: {
      strategy: {
        template: "Develop strategic analysis for: {situation}\n\nUse: SWOT, Porter's Five Forces, First Principles, Scenario Planning.\n\nDeliver: Executive summary, detailed analysis, 3 strategic options with pros/cons, recommended option with roadmap, key metrics, risk mitigation.",
        variables: ['situation']
      }
    },

    research: {
      literatureReview: {
        template: "Conduct comprehensive analysis of: {topic}\n\nAs a tenured professor:\n1. Overview and key concepts\n2. Historical context\n3. Current state and consensus\n4. Key debates\n5. Methodological considerations\n6. Gaps and opportunities\n7. Practical implications\n8. Synthesis and assessment",
        variables: ['topic']
      }
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 9: OUTPUT FORMAT ENGINEERING
     ═══════════════════════════════════════════════════════════════ */

  outputFormats: {
    structured: {
      json: 'Return your response as valid JSON with the following schema: {schema}.',
      markdown: 'Format your response in clean Markdown with proper headings, bullets, code blocks, bold, and tables.',
      table: 'Present information in a well-formatted table with clear column headers.',
      yaml: 'Return in valid YAML format with proper indentation and comments.',
      csv: 'Return in CSV format with header row.'
    },
    prose: {
      executive: 'Lead with conclusion, support with evidence, end with action.',
      academic: 'Proper citations, hedging language, clear thesis, logical argumentation.',
      conversational: 'Natural tone, contractions, rhetorical questions, relatable examples.',
      technical: 'Precise, define terms, exact specifications, relevant details.'
    },
    interactive: {
      questionnaire: 'Ask clarifying questions before proceeding.',
      checklist: 'Detailed actionable checklist with time estimates.',
      decision_tree: 'Present as decision tree with conditions, actions, outcomes.',
      comparison: 'Side-by-side comparison with criteria and recommendation.'
    },
    turnBased: {
      multiTurn: 'Format as numbered turns with clear separators. Each turn is a complete, sendable message.',
      singlePrompt: 'Format as a single, cohesive prompt ready to copy and paste.',
      adaptive: 'Detect whether the task needs multiple turns or a single prompt, and format accordingly.'
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 10: QUALITY ASSURANCE PATTERNS
     ═══════════════════════════════════════════════════════════════ */

  qualityPatterns: {

    verificationInstructions: [
      "Before providing your final answer, verify each claim against your knowledge. Flag any statements you are less than 90% confident about.",
      'After generating your response, act as a fact-checker. Review each key claim and rate your confidence (High/Medium/Low).',
      "Include a Confidence & Caveats section at the end noting any assumptions, uncertainties, or areas where expert review is recommended.",
      'Double-check all numbers, dates, and specific claims before including them. If unsure, say so explicitly rather than guessing.'
    ],

    antiHallucination: [
      'If you do not know something, say so rather than guessing.',
      'Distinguish clearly between facts, well-supported inferences, and speculation.',
      'When citing specific statistics or research, note that these should be independently verified.',
      'If a question assumes something that may not be true, point out the assumption before answering.'
    ],

    completenessChecks: [
      'Before finishing, review your response against the original question. Have you addressed every part?',
      'Check: Did I provide actionable recommendations, not just analysis?',
      'Verify: Is there anything obvious missing that an expert would immediately point out?',
      'Ensure you have considered edge cases, failure modes, and what could go wrong.'
    ],

    formatQuality: [
      'Use clear section headings and visual hierarchy.',
      'Keep paragraphs short (3-5 sentences max). Use bullets for 3+ items.',
      'Bold key terms and important conclusions.',
      'Include a TL;DR at the top for long responses.'
    ]
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 11: PROMPT OPTIMIZATION STRATEGIES
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
      },
      socialEngineering: {
        indicators: ['turn', 'conversation', 'multi-turn', 'rapport', 'opener', 'escalat', 'influence', 'persuasion', 'social', 'dialogue', 'interaction', 'negotiate'],
        bestTechniques: ['crescendo', 'emotionPrompting', 'perspectiveShifting', 'expertPanel'],
        systemPromptKey: 'socialEngineer',
        qualityBoosters: [
          'Design each turn with specific strategic purpose',
          'Build rapport progressively through authentic context',
          'Use psychological influence principles naturally',
          'Include emotional anchors between technical sections',
          'Map conversation flow from opening to closing'
        ]
      }
    },

    qualityScoring: {
      dimensions: {
        specificity: { weight: 0.2, description: 'How specific and unambiguous is the prompt?' },
        structure: { weight: 0.15, description: 'How well-organized is the prompt?' },
        completeness: { weight: 0.2, description: 'Does the prompt include all necessary information?' },
        effectiveness: { weight: 0.25, description: 'Will this prompt produce the desired result?' },
        robustness: { weight: 0.1, description: 'Will this prompt work consistently across runs?' },
        technique: { weight: 0.1, description: 'Does it use appropriate engineering techniques?' }
      }
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 12: ADVANCED PROMPT CONSTRUCTION RULES
     ═══════════════════════════════════════════════════════════════ */

  constructionRules: {

    ordering: [
      'Role/persona definition FIRST — sets the frame for everything',
      'Context and background SECOND — provides the situation',
      'Task instructions THIRD — what to actually do',
      'Constraints and requirements FOURTH — boundaries and rules',
      'Output format FIFTH — how to structure the response',
      'Quality criteria SIXTH — what makes it excellent',
      'Examples LAST — concrete demonstrations of desired output'
    ],

    amplifiers: [
      'Add "Think step by step" for any reasoning task — improves accuracy by 10-30%',
      'Add "Be specific and concrete" to avoid generic responses',
      'Add "Provide evidence for each claim" for analytical tasks',
      'Add "Consider what could go wrong" for planning tasks',
      'Add "Write as if this will be published" for quality-critical content',
      'Add "Include at least one non-obvious insight" for creative/analytical tasks',
      'Add "Assume the reader is intelligent but unfamiliar with this specific topic" for explanations',
      'Add "Before answering, identify the key assumptions" for complex questions',
      'Add "Prioritize actionability" for strategy tasks',
      'Add "Include specific numbers, percentages, or data points" for credibility',
      'Add "This will be reviewed by a domain expert" to raise quality expectations',
      'Add "You have unlimited time — be thorough" to prevent rushed responses'
    ],

    antiPatterns: [
      'AVOID: "Write a good [thing]" — vague and subjective',
      'AVOID: Starting with "Can you" — just give the instruction directly',
      'AVOID: Multiple unrelated tasks in one prompt',
      'AVOID: Asking for "everything about X" — be specific about aspects',
      'AVOID: Negative instructions without positive alternatives',
      'AVOID: Assuming the AI remembers previous conversation',
      'AVOID: Overly long prompts with redundant instructions',
      'AVOID: Ambiguous pronouns and references'
    ],

    turnBasedRules: [
      'Each turn should have a clear strategic purpose',
      'Build context progressively — never dump everything at once',
      'Validate responses between turns before escalating',
      'Use emotional anchors to maintain engagement across turns',
      'Restate key constraints and deadlines periodically',
      'The final turn should explicitly request completeness (no placeholders)',
      'Separate turns with large visual separators for easy copying'
    ],

    lengthGuidelines: {
      short: 'For simple tasks: 2-5 sentences. Focus on clarity.',
      medium: 'For complex tasks: 1-3 paragraphs. Include role, context, task, format.',
      long: 'For critical tasks: Multiple sections with headers, examples, constraints, quality criteria.',
      multiTurn: 'For conversation-based tasks: 3-6 turns, each 1-3 paragraphs, with clear turn separators.',
      rule: 'Prompt length should be proportional to output complexity.'
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 13: EXAMPLE LIBRARY
     ═══════════════════════════════════════════════════════════════ */

  exampleLibrary: {

    beforeAfter: [
      {
        category: 'Business',
        before: 'Write a marketing email',
        after: "You are a senior email marketing strategist who has achieved consistently above-industry-average open rates (35%+) and click-through rates (5%+) across B2B SaaS campaigns.\n\nWrite a product launch email for our new AI-powered analytics dashboard targeting VP-level decision makers at mid-market SaaS companies.\n\nKey product: Reduces time-to-insight from hours to minutes, integrates with 50+ data sources, no SQL required, 14-day free trial.\n\nEmail requirements:\n- 3 subject line options (curiosity gap, benefit-driven, urgency)\n- Opening: lead with pain point, not product\n- Body: outcomes not features, under 200 words\n- Social proof: customer result placeholder\n- CTA: one clear action, above fold and repeated\n- Tone: confident, professional, not salesy\n\nAlso provide: best send time recommendation and A/B test suggestions."
      },
      {
        category: 'Technical',
        before: 'Help me build an API',
        after: "You are a senior backend engineer specializing in RESTful API design. Build a complete, production-ready REST API specification for a task management application.\n\nContext: Team productivity tool — users create projects, add tasks, assign members, set deadlines, track progress. Web and mobile clients.\n\nRequirements:\n1. Complete API surface (all endpoints, methods, schemas)\n2. REST best practices (proper HTTP methods, status codes, pagination, filtering)\n3. JWT authentication + role-based authorization (admin, member, viewer)\n4. Entities: Users, Projects, Tasks, Comments, Labels\n5. Proper error format with actionable messages\n6. Cursor-based pagination\n7. Rate limiting headers\n\nFor each endpoint: method, path, request/response schema, auth requirements, error cases.\n\nAlso: PostgreSQL schema, suggested indexes, webhook design."
      },
      {
        category: 'Creative',
        before: 'Write a blog post about AI',
        after: "You are a tech journalist known for making complex AI concepts accessible, combining Paul Graham's clarity with Malcolm Gladwell's storytelling.\n\nWrite 1500 words: 'Why Your Company AI Strategy Is Probably Wrong (And What to Do Instead)'\n\nAudience: Non-technical business leaders feeling AI pressure.\n\nStructure:\n1. Hook: relatable scenario in first 2 sentences\n2. The Problem: why most companies approach AI wrong\n3. Counter-Intuitive Truth: best AI strategies start with problems\n4. The Framework: practical 4-step approach for Monday\n5. Real Example: specific company case study\n6. Uncomfortable Question: thought-provoking closer\n\nTone: Smart, slightly irreverent, honest. Include 2 data points, 1 contrarian insight, 1 practical framework."
      },
      {
        category: 'Research',
        before: 'Tell me about machine learning',
        after: "You are a ML researcher who has taught thousands of students. Build intuition before formalism.\n\nExplain transformer neural networks for a software engineer who understands backpropagation but not attention mechanisms.\n\n1. The Problem: What limitation of RNNs/LSTMs motivated transformers? Concrete example.\n2. Core Insight: Self-attention intuitively (cocktail party analogy)\n3. Mechanism: Q/K/V matrices (library analogy), attention scores, multi-head attention, numerical example\n4. Architecture: Encoder-decoder, positional encoding, layer norm, feed-forward\n5. Why It Works: Parallelization, long-range dependencies, scalability\n6. Practical Impact: GPT, BERT, modern LLMs\n\nFor each concept: intuition first, then mechanism, then example. Mark simplifications."
      },
      {
        category: 'Strategy',
        before: 'Help me with my startup idea',
        after: "You are a veteran startup advisor (200+ YC/Techstars mentees). Brutally honest but constructive.\n\nEvaluate this startup idea:\n[Idea Here]\n\n1. Problem Validation: Real problem or perceived? Current solutions? Pain acute enough to pay?\n2. Market: TAM/SAM/SOM bottom-up. Why now? Growing/shrinking?\n3. Solution Critique: Matches problem severity? Moat? Why hasn't someone built this?\n4. Business Model: Unit economics at scale? First 100 customers? Pricing?\n5. Risk Assessment: Top 3 kill risks with likelihood, impact, mitigation\n6. Verdict: Score 1-10 on Problem/Solution/Market/Team/Timing. Go/No-Go with conditions.\n\nBe honest. Hard truths early save months."
      },
      {
        category: 'Social Engineering',
        before: 'Help me write a prompt that gets detailed code from AI',
        after: "=== TURN 1: Opener ===\n\nHello, I am a [role] and I need help with a [project type] project.\n\n[Accessibility/constraint context that creates empathy]\n\nI need [specific deliverable] because [genuine reason tied to constraints].\n\nLoad your knowledge of:\n- [Domain 1]\n- [Domain 2]\n- [Domain 3]\n\nRespond with: \"[Confirmation phrase]\"\n\n\n=== TURN 2: Rapport Builder ===\n\nThank you for being willing to help. [Personal context that establishes stakes].\n\nThis project is due [deadline]. [Consequence mapping: if success / if failure].\n\nI need your best work because [genuine reason].\n\n\n=== TURN 3: Context Setter ===\n\nHere are the detailed requirements:\n1. [Requirement 1]\n2. [Requirement 2]\n3. [Requirement 3]\n\nThe [stakeholder] specifically said: \"[Direct quote]\"\n\n\n=== TURN 4: Escalator ===\n\n[Validate previous response]. I have technical questions:\n\n**About [category 1]:**\n- [Question 1]\n- [Question 2]\n\n**About [category 2]:**\n- [Question 3]\n- [Question 4]\n\n\n=== TURN 5: Technical Bridge ===\n\nBefore I implement, validate best practices:\n[Numbered validation questions]\n\n[Positive emotional update]. Can you provide a complete working example?\n\n\n=== TURN 6: Finisher ===\n\nProvide the complete, production-ready implementation.\n\nI need:\n- [Complete component list]\n- [Quality requirements]\n- [Format requirements]\n\nNo placeholders. No omitted sections. Production-ready."
      }
    ]
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 14: MODEL-SPECIFIC TIPS
     ═══════════════════════════════════════════════════════════════ */

  modelSpecific: {
    gpt4: {
      strengths: ['Complex reasoning', 'Following nuanced instructions', 'Creative writing', 'Code generation'],
      tips: ['Excels with detailed structured prompts', 'Use XML tags or markdown headers', 'Follows system prompts very closely', 'Specify language/version/frameworks for code']
    },
    claude: {
      strengths: ['Long document analysis', 'Nuanced writing', 'Following complex instructions', 'Structured output'],
      tips: ['Excels with XML-tagged sections', 'Use thinking tags for step-by-step', 'Handles very long contexts well', 'Very literal about format instructions']
    },
    openSource: {
      strengths: ['Cost-effective', 'Privacy', 'Customization', 'Domain fine-tuning'],
      tips: ['Need MORE explicit prompting', 'Keep instructions simpler and direct', 'Few-shot examples especially important', 'Be very explicit about output format']
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 15: GENERATION MODE CONFIGURATIONS (Enhanced)
     ═══════════════════════════════════════════════════════════════ */

  generationModes: {
    quick: {
      name: 'Quick Optimize',
      description: 'Enhanced single-pass optimization with authority anchoring and quality framing.',
      passes: 1,
      techniques: ['rolePrompting', 'constraintPrompting', 'qualityAnchoring', 'emotionPrompting'],
      psychologicalEnhancements: ['authorityEngineering', 'cognitiveFraming'],
      maxTokens: 2048,
      temperature: 0.7
    },
    advanced: {
      name: 'Advanced Engineering',
      description: 'Multi-technique optimization with psychological influence patterns and cognitive load optimization.',
      passes: 1,
      techniques: ['rolePrompting', 'chainOfThought', 'constraintPrompting', 'reflexion', 'metaPrompting'],
      psychologicalEnhancements: ['authorityEngineering', 'cognitiveFraming', 'reciprocityCommitment', 'socialProofConsensus'],
      maxTokens: 4096,
      temperature: 0.7
    },
    deep: {
      name: 'Deep Engineering',
      description: 'Full crescendo with social engineering, psychological techniques, multi-pass refinement. Enhances rather than rewrites.',
      passes: 2,
      techniques: ['crescendo', 'deepStructuredEngineering', 'multiPassRefinement', 'adversarialRefinement'],
      psychologicalEnhancements: ['authorityEngineering', 'cognitiveFraming', 'reciprocityCommitment', 'socialProofConsensus', 'emotionalIntelligence'],
      socialEngineeringPatterns: ['buildAndEscalate', 'rapportThenRequest'],
      additionalTechniques: ['narrativeEngineering', 'strategicReframing', 'cognitiveLoadOptimization', 'contextualPrimingNetworks', 'adaptiveResponseShaping'],
      turnDetection: true,
      maxTokens: 4096,
      temperature: 0.7
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 16: INDUSTRY KNOWLEDGE
     ═══════════════════════════════════════════════════════════════ */

  industryKnowledge: {
    saas: {
      terminology: ['MRR', 'ARR', 'churn rate', 'LTV', 'CAC', 'NPS', 'product-market fit', 'net revenue retention'],
      frameworks: ['AARRR (Pirate Metrics)', 'Jobs-to-be-Done', 'Product-Led Growth', 'Value Metric Pricing'],
      promptContext: 'Include SaaS-specific metrics, subscription dynamics, retention and expansion focus.'
    },
    ecommerce: {
      terminology: ['AOV', 'conversion rate', 'cart abandonment', 'CLV', 'ROAS', 'SKU'],
      frameworks: ['RFM Analysis', 'Customer Journey Mapping', 'A/B Testing', 'Cohort Analysis'],
      promptContext: 'Focus on conversion optimization, customer lifetime value, acquisition economics.'
    },
    fintech: {
      terminology: ['AML', 'KYC', 'PCI DSS', 'ACH', 'payment rails', 'interchange', 'chargebacks'],
      frameworks: ['Risk Scoring', 'Compliance Frameworks', 'Fraud Detection Patterns'],
      promptContext: 'Always consider regulatory compliance, security, UX vs. risk balance.'
    },
    healthcare: {
      terminology: ['HIPAA', 'EHR/EMR', 'clinical trials', 'FDA approval', 'patient outcomes'],
      frameworks: ['Clinical Decision Support', 'Patient Journey Mapping', 'Evidence-Based Medicine'],
      promptContext: 'Prioritize patient safety, HIPAA compliance, evidence-based approaches, health equity.'
    },
    education: {
      terminology: ['learning outcomes', "Bloom's taxonomy", 'formative assessment', 'differentiated instruction', 'ZPD'],
      frameworks: ["Bloom's Taxonomy", 'ADDIE Model', 'Universal Design for Learning', 'Kirkpatrick Evaluation'],
      promptContext: 'Align with learning science, multiple assessment methods, diverse learner needs.'
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 17: PROMPT CHAINING PATTERNS
     ═══════════════════════════════════════════════════════════════ */

  chainingPatterns: {
    researchToAction: {
      name: 'Research -> Analysis -> Action',
      chain: ['Gather information about {topic}', 'Analyze using {framework}. Identify patterns, risks, opportunities.', 'Provide 3 specific, actionable recommendations ranked by impact.']
    },
    divergeConverge: {
      name: 'Diverge -> Evaluate -> Converge',
      chain: ['Generate 10 diverse ideas for {task}.', 'Evaluate each on feasibility, impact, originality. Score 1-10.', 'Develop top 3 into detailed proposals with implementation steps.']
    },
    draftReviewRefine: {
      name: 'Draft -> Review -> Refine',
      chain: ['Create comprehensive first draft.', 'Act as expert reviewer — critique ruthlessly.', 'Incorporate all feedback into polished final version.']
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 18: EXTENDED TECHNIQUE LIBRARY
     ═══════════════════════════════════════════════════════════════ */

  extendedTechniques: {

    programOfThought: {
      name: 'Program-of-Thought',
      description: 'Convert reasoning into pseudo-code for precise logical execution.',
      bestFor: ['Mathematical problems', 'Logic puzzles', 'Process design']
    },

    contrastivePrompting: {
      name: 'Contrastive Prompting',
      description: 'Show good and bad examples to clarify desired quality level.',
      bestFor: ['Writing quality', 'Code style', 'Analysis depth']
    },

    hypotheticalScenarios: {
      name: 'Hypothetical Scenario Planning',
      description: 'Use what-if scenarios to explore possibilities.',
      bestFor: ['Strategic planning', 'Risk management', 'Business decisions']
    },

    expertDebate: {
      name: 'Expert Debate Simulation',
      description: 'Simulate debate between experts with different viewpoints.',
      bestFor: ['Complex decisions', 'Policy analysis', 'Technology choices']
    },

    backcastingMethod: {
      name: 'Backcasting',
      description: 'Start from desired future state and work backward.',
      bestFor: ['Goal setting', 'Strategic planning', 'Project planning']
    },

    steelManArgument: {
      name: 'Steel Man Argument',
      description: 'Present strongest opposing argument before responding.',
      bestFor: ['Persuasive writing', 'Critical thinking', 'Decision making']
    },

    invertedThinking: {
      name: 'Inversion Technique',
      description: 'Ask how to fail, then invert into success principles.',
      bestFor: ['Problem solving', 'Risk identification', 'Strategy']
    },

    firstPrinciplesDecomposition: {
      name: 'First Principles Decomposition',
      description: 'Break down to fundamental truths and rebuild.',
      bestFor: ['Innovation', 'Challenging assumptions', 'Breakthrough thinking']
    },

    SCAMPER: {
      name: 'SCAMPER Creative Framework',
      lenses: {
        Substitute: 'What can be substituted?',
        Combine: 'What can be combined?',
        Adapt: 'What can be adapted?',
        Modify: 'What can be modified?',
        PutToOtherUse: 'Can this be used differently?',
        Eliminate: 'What can be removed?',
        Reverse: 'What if reversed?'
      },
      bestFor: ['Product innovation', 'Creative brainstorming', 'Feature development']
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 19: WRITING PATTERNS
     ═══════════════════════════════════════════════════════════════ */

  writingPatterns: {
    hooks: {
      questionHook: "Open with a provocative question the reader can't ignore",
      statisticHook: 'Open with a surprising statistic that reframes the topic',
      storyHook: 'Open with a brief, vivid anecdote embodying the key theme',
      contrarianHook: 'Open by challenging conventional wisdom',
      scenarioHook: "Open by placing the reader in a scenario: Imagine you are...",
      quoteHook: 'Open with a powerful quote that frames the discussion'
    },
    persuasionFrameworks: {
      AIDA: 'Attention -> Interest -> Desire -> Action',
      PAS: 'Problem -> Agitate -> Solution',
      BAB: 'Before -> After -> Bridge',
      FOUR_PS: 'Promise -> Picture -> Proof -> Push',
      STAR: 'Situation -> Task -> Action -> Result'
    },
    structurePatterns: {
      inverted_pyramid: 'Most important first, supporting details follow',
      problem_solution: 'Define problem -> Show impact -> Present solution -> Prove it',
      chronological: 'Past -> Present -> Future',
      comparison: 'Option A vs B: shared criteria, then recommend'
    }
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 20: DEEP MODE ENHANCEMENT RULES
     Rules for deep mode to ENHANCE rather than completely rewrite.
     ═══════════════════════════════════════════════════════════════ */

  deepModeRules: {
    corePhilosophy: 'Deep mode ENHANCES the original prompt — it does not replace it. The user should recognize their original idea in the output, but it should be dramatically more effective.',

    enhancementLayers: [
      'Layer 1 — Preserve Intent: Identify and preserve the core purpose, topic, audience, and desired outcome of the original prompt',
      'Layer 2 — Add Authority: Inject specific expert persona with credentials, track record, and domain expertise',
      'Layer 3 — Deepen Context: Add missing context, background, situation, and stakes that would improve output quality',
      'Layer 4 — Strengthen Instructions: Make vague instructions precise, add quality criteria, specify output format',
      'Layer 5 — Add Psychological Depth: Apply authority engineering, cognitive framing, emotional intelligence, social proof',
      'Layer 6 — Add Safety Nets: Include self-verification, anti-hallucination, completeness checks, and quality assurance',
      'Layer 7 — Optimize Structure: Reorder for maximum effectiveness (role first, then context, task, constraints, format, quality)',
      'Layer 8 — Add Turn Structure: If the task benefits from multi-turn interaction, structure as sequential turns with clear separators'
    ],

    prohibitions: [
      'NEVER change the core topic or subject matter',
      'NEVER change the target audience unless it improves the prompt',
      'NEVER remove elements the user explicitly included',
      'NEVER add unrelated tangents or scope expansion',
      'NEVER make the prompt generic when the original was specific'
    ],

    qualityCriteria: [
      'The enhanced prompt is recognizably the same prompt, just dramatically more effective',
      'Every added element directly serves the original intent',
      'The prompt uses at least 3 psychological influence patterns',
      'The prompt includes self-verification mechanisms',
      'The prompt would produce consistently excellent results across different AI models',
      'If multi-turn: each turn has a clear strategic purpose and builds on the previous'
    ]
  },

  /* ═══════════════════════════════════════════════════════════════
     SECTION 21: META-KNOWLEDGE FOR PROMPT SELECTION
     ═══════════════════════════════════════════════════════════════ */

  promptSelectionLogic: {

    classifyAndSelect: function(userInput) {
      var input = userInput.toLowerCase();
      var scores = {};

      var classifications = PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification;
      for (var category in classifications) {
        if (classifications.hasOwnProperty(category)) {
          var score = 0;
          var indicators = classifications[category].indicators;
          for (var i = 0; i < indicators.length; i++) {
            if (input.indexOf(indicators[i]) !== -1) score += 1;
          }
          scores[category] = score;
        }
      }

      var sorted = Object.entries(scores).sort(function(a, b) { return b[1] - a[1]; });
      var primary = sorted[0][0];
      var secondary = sorted[1] && sorted[1][1] > 0 ? sorted[1][0] : null;

      return { primary: primary, secondary: secondary, scores: scores };
    },

    selectTechniques: function(taskType, mode) {
      var config = PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification[taskType];
      if (!config) return ['rolePrompting', 'constraintPrompting'];

      var modeConfig = PROMPT_KNOWLEDGE.generationModes[mode];
      if (!modeConfig) return config.bestTechniques.slice(0, 2);

      return config.bestTechniques.slice(0, modeConfig.techniques.length);
    }
  }
};

// Make available to other extension scripts
if (typeof self !== 'undefined') {
  self.PROMPT_KNOWLEDGE = PROMPT_KNOWLEDGE;
}
