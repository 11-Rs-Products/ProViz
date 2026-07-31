function generatePolyStepsLogic(coeffs, xVal) {
    const generatedSteps = [];
    const n = coeffs.length;
    
    generatedSteps.push({
        title: "Step 0: The Problem",
        desc: `Evaluate the polynomial with coefficients [${coeffs.join(', ')}] at x = ${xVal}.`,
        codeSnippet: `<div class="question-image-mimic">\n  <h2>Compute Polynomial Value</h2>\n  <p>Write a function <code>evaluate_polynomial(coefficients: list, x: float) -> float</code> that computes the value of a polynomial given its coefficients and a value for <code>x</code>. The coefficients will be provided as a list in descending order, where:</p>\n  <ul>\n    <li>The first element is the coefficient for the highest degree,</li>\n    <li>The last element is the constant term.</li>\n  </ul>\n  <p>For example, if the polynomial is represented as ( 2x^3 + 3x^2 + 5x + 7 ), the coefficients list would be <code>[2, 3, 5, 7]</code>.</p>\n  <h3>Constraints</h3>\n  <ul>\n    <li>The coefficients list will have at least one element.</li>\n    <li>The value of <code>x</code> will be of type <code>int</code>.</li>\n  </ul>\n  <p class="note">NOTE: This is a function type question, you don't have to take input or print the output, just have to complete the required function definition.</p>\n</div>`,
        animate: (instant) => {
            gsap.to(camera.position, { duration: instant ? 0 : 1 });
            if(!instant) onAnimationComplete();
        }
    });

    generatedSteps.push({
        title: "Step 1: Initialize Result",
        desc: `Set the initial result to 0. We will iterate through each coefficient using Horner's method to evaluate efficiently.`,
        codeSnippet: `<span class="keyword">def</span> <span class="function">evaluate_polynomial</span>(coefficients: <span class="variable">list</span>, x: <span class="variable">float</span>) -> <span class="variable">float</span>:\n    result = <span class="number">0</span>`,
        animate: (instant) => {
            if(!group.getObjectByName('block_result')) {
                const resBlock = createBlock(`res=0`, 0x10b981);
                resBlock.name = 'block_result';
                resBlock.position.set(0, -2, 0);
                resBlock.scale.set(0,0,0);
                group.add(resBlock);
                gsap.to(resBlock.scale, {x:1.5, y:1.5, z:1.5, duration: instant ? 0 : 0.8, onComplete: () => { if(!instant) onAnimationComplete(); }});
            } else {
                if(!instant) onAnimationComplete();
            }
        }
    });

    let currentRes = 0;
    
    for (let i = 0; i < n; i++) {
        const c = coeffs[i];
        let oldRes = currentRes;
        currentRes = currentRes * xVal + c;
        
        generatedSteps.push({
            title: `Step ${i+2}: Process Coefficient ${c}`,
            desc: `Update result: result = result * x + coef = ${oldRes} * ${xVal} + ${c} = ${currentRes}.`,
            codeSnippet: `    <span class="keyword">for</span> coef <span class="keyword">in</span> coefficients:\n        <span class="comment"># Processing coef = ${c}</span>\n        result = result * x + coef`,
            animate: (instant) => {
                const slotBo = blockObjects.find(b => b.data.type === 'coef' && b.data.idx === i);
                const xBo = blockObjects.find(b => b.data.type === 'var_x');
                const resBlock = group.getObjectByName('block_result');
                
                if (slotBo && xBo && resBlock) {
                    const cClone = createBlock(c.toString(), 0x334155);
                    cClone.position.copy(slotBo.mesh.position);
                    group.add(cClone);
                    
                    const xClone = createBlock(xVal.toString(), 0x2563eb);
                    xClone.position.copy(xBo.mesh.position);
                    group.add(xClone);
                    
                    gsap.to(xClone.position, {x: resBlock.position.x - 0.8, y: resBlock.position.y + 1, z: 0.5, duration: instant ? 0: 0.5});
                    gsap.to(cClone.position, {x: resBlock.position.x + 0.8, y: resBlock.position.y + 1, z: 0.5, duration: instant ? 0: 0.5, delay: instant ? 0 : 0.2});
                    
                    gsap.to(xClone.scale, {x:0, y:0, z:0, duration: instant? 0: 0.4, delay: instant? 0: 0.8});
                    gsap.to(cClone.scale, {x:0, y:0, z:0, duration: instant? 0: 0.4, delay: instant? 0: 0.8});
                    
                    setTimeout(() => {
                        group.remove(xClone);
                        group.remove(cClone);
                        const newResBlock = createBlock(`res=${currentRes}`, 0x10b981);
                        newResBlock.name = 'block_result';
                        newResBlock.position.copy(resBlock.position);
                        newResBlock.scale.set(0,0,0);
                        group.add(newResBlock);
                        gsap.to(newResBlock.scale, {x:1.5, y:1.5, z:1.5, duration: instant? 0 : 0.4, ease: "back.out"});
                        
                        group.remove(resBlock);
                        if(!instant) onAnimationComplete();
                    }, instant ? 0 : 1200);
                    if (instant) onAnimationComplete();
                } else {
                    if (instant) onAnimationComplete();
                }
            }
        });
    }

    generatedSteps.push({
        title: `Step ${n+2}: Solution Computed`,
        desc: `The polynomial value has been successfully computed: ${currentRes}.`,
        codeSnippet: `<span class="keyword">def</span> <span class="function">evaluate_polynomial</span>(coefficients: <span class="variable">list</span>, x: <span class="variable">float</span>) -> <span class="variable">float</span>:\n    result = <span class="number">0</span>\n    <span class="keyword">for</span> coef <span class="keyword">in</span> coefficients:\n        result = result * x + coef\n    <span class="keyword">return</span> result`,
        animate: (instant) => {
            const resBlock = group.getObjectByName('block_result');
            if (resBlock) {
                gsap.to(resBlock.rotation, { y: Math.PI * 2, duration: instant ? 0 : 1, ease: "power2.out" });
                gsap.to(resBlock.scale, { x: 1.8, y: 1.8, z: 1.8, yoyo: true, repeat: 1, duration: instant ? 0 : 0.5, onComplete: () => { if(!instant) onAnimationComplete(); } });
            } else {
                if(!instant) onAnimationComplete();
            }
            if (instant) onAnimationComplete();
        }
    });

    return generatedSteps;
}

function initPolyScene(targetStep = 0) {
    errorMsg.innerText = '';
    const polyStr = document.getElementById('poly-input').value || "2, 3, 5, 7";
    const xVal = parseInt(document.getElementById('x-input').value) || 2;
    
    let coeffs = [];
    try {
        coeffs = polyStr.split(',').map(s => {
            const parsed = parseFloat(s.trim());
            if(isNaN(parsed)) throw new Error();
            return parsed;
        });
    } catch(e) {
        errorMsg.innerText = "Invalid coefficients. Use comma separated numbers.";
        return;
    }
    
    while(group.children.length > 0){ group.remove(group.children[0]); }
    blockObjects = [];
    
    const n = coeffs.length;
    
    // x block
    const xBlockMesh = createBlock(`x=${xVal}`, 0x2563eb);
    xBlockMesh.position.set(0, 2, 0);
    group.add(xBlockMesh);
    blockObjects.push({ mesh: xBlockMesh, data: { type: 'var_x', val: xVal }, originX: 0 });

    // array slots
    for(let i=0; i<n; i++) {
        let slot = createBlock(coeffs[i].toString(), 0x334155);
        slot.position.set(-((n-1)*1.6)/2 + i*1.6, 0, 0);
        group.add(slot);
        blockObjects.push({ mesh: slot, data: { type: 'coef', idx: i }, originX: slot.position.x });
    }
    
    camera.position.z = Math.max(16, n * 1.5);
    
    steps = generatePolyStepsLogic(coeffs, xVal);
    
    currentStep = -1;
    for(let i = 0; i < targetStep; i++) {
        currentStep = i;
        steps[i].animate(true);
        isStepImplemented = true;
    }
    
    currentStep = targetStep;
    isStepImplemented = false;
    if (targetStep === 0) steps[0].animate(false); 
    else updateUI();
}
