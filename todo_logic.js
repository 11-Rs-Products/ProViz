// Todo mode setup
function createWideBlock(char, color, width = 8) {
    const size = 1.4;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.beginPath();
    ctx.roundRect(8, 8, 1008, 240, 16);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    let fontSize = 100;
    ctx.font = `bold ${fontSize}px Inter, monospace`;
    
    let textWidth = ctx.measureText(char).width;
    while (textWidth > 960 && fontSize > 20) {
        fontSize -= 5;
        ctx.font = `bold ${fontSize}px Inter, monospace`;
        textWidth = ctx.measureText(char).width;
    }
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 48, 138); 

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    
    const plainMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, metalness: 0.5 });
    const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.1, metalness: 0.2 });
    const materials = [plainMat, plainMat, plainMat, plainMat, material, plainMat];
    
    const geometry = new THREE.BoxGeometry(width, size, size * 0.15);
    const mesh = new THREE.Mesh(geometry, materials);
    
    return mesh;
}

function generateTodoStepsLogic(indices, items) {
    const generatedSteps = [];
    
    generatedSteps.push({
        title: "Step 0: The Problem",
        desc: `Given ${items.length} items, mark indices [${indices.join(', ')}] as completed.`,
        codeSnippet: `<div class="question-image-mimic">\n  <h2>Update Todo List Based on Given Indices</h2>\n  <p>Given a todo list formatted as multiple lines, where each todo item is represented as <code>- [ ] item</code>. Your task is to mark the todo items as completed based on the indices provided in the first line of the input. The completed items should be marked with <code>- [x]</code>.</p>\n  <p class="note">NOTE: This is an I/O type question. You need to write the complete code to read the input and print the output.</p>\n  <h3>Input Format</h3>\n  <ul>\n    <li>The first line contains the number of items in the todo list</li>\n    <li>The second line contains a space-separated list of indices (0-based) indicating which items in the todo list should be marked as completed.</li>\n    <li>The subsequent lines contain the todo list items.</li>\n  </ul>\n  <h3>Output Format</h3>\n  <ul>\n    <li>Print the updated todo list with the specified items marked as completed.</li>\n  </ul>\n</div>`,
        animate: (instant) => {
            gsap.to(camera.position, { duration: instant ? 0 : 1 });
            if(!instant) onAnimationComplete();
        }
    });

    generatedSteps.push({
        title: "Step 1: Read Inputs",
        desc: `Read n, indices, and the list of items. Initialize the UI state.`,
        codeSnippet: `n = <span class="variable">int</span>(<span class="function">input</span>())\nindices = <span class="variable">list</span>(<span class="function">map</span>(<span class="variable">int</span>, <span class="function">input</span>().split()))\nitems = []\n<span class="keyword">for</span> _ <span class="keyword">in</span> <span class="variable">range</span>(n):\n    items.append(<span class="function">input</span>())`,
        animate: (instant) => {
            gsap.to(camera.position, { duration: instant ? 0 : 0.5, onComplete: () => { if(!instant) onAnimationComplete(); }});
        }
    });

    for (let i = 0; i < indices.length; i++) {
        let idx = indices[i];
        if(idx < 0 || idx >= items.length) continue;
        
        generatedSteps.push({
            title: `Step ${i+2}: Mark index ${idx} completed`,
            desc: `Update item at index ${idx} to [x].`,
            codeSnippet: `<span class="keyword">for</span> idx <span class="keyword">in</span> indices:\n    <span class="comment"># Processing index ${idx}</span>\n    items[idx] = items[idx].replace(<span class="string">"- [ ]"</span>, <span class="string">"- [x]"</span>)`,
            animate: (instant) => {
                const targetBo = blockObjects.find(b => b.data.type === 'todo' && b.data.idx === idx);
                if (targetBo) {
                    const newText = `- [x] ${targetBo.data.rawText}`;
                    const completedBlock = createWideBlock(newText, 0x10b981);
                    completedBlock.position.copy(targetBo.mesh.position);
                    completedBlock.scale.set(0, 0, 0);
                    group.add(completedBlock);
                    
                    gsap.to(targetBo.mesh.scale, {x:0, y:0, z:0, duration: instant ? 0 : 0.4});
                    gsap.to(completedBlock.scale, {x:1.05, y:1.05, z:1.05, duration: instant ? 0 : 0.5, ease: "back.out", delay: instant ? 0 : 0.2, onComplete: () => {
                        gsap.to(completedBlock.scale, {x:1, y:1, z:1, duration: instant ? 0 : 0.3});
                        if(!instant) onAnimationComplete();
                    }});
                } else {
                    if(!instant) onAnimationComplete();
                }
                if(instant) onAnimationComplete();
            }
        });
    }

    generatedSteps.push({
        title: `Final Step: Print Output`,
        desc: `Print the updated list line by line.`,
        codeSnippet: `<span class="keyword">for</span> item <span class="keyword">in</span> items:\n    <span class="function">print</span>(item)`,
        animate: (instant) => {
            gsap.to(camera.position, {z: Math.max(18, items.length * 2.5), duration: instant ? 0 : 1});
            if(!instant) onAnimationComplete();
        }
    });

    return generatedSteps;
}

function initTodoScene(targetStep = 0) {
    errorMsg.innerText = '';
    const indicesStr = document.getElementById('todo-indices').value || "0, 2";
    const itemsStr = document.getElementById('todo-items').value || "Buy milk, Walk dog, Write code";
    
    let indices = [];
    try {
        indices = indicesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    } catch(e) {
        errorMsg.innerText = "Invalid indices.";
        return;
    }
    
    let items = itemsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    while(group.children.length > 0){ group.remove(group.children[0]); }
    blockObjects = [];
    
    const n = items.length;
    let startY = (n * 1.8) / 2 - 0.9;
    
    for(let i=0; i<n; i++) {
        let block = createWideBlock(`- [ ] ${items[i]}`, 0x334155);
        block.position.set(0, startY - i * 1.8, 0);
        group.add(block);
        blockObjects.push({ mesh: block, data: { type: 'todo', idx: i, rawText: items[i] } });
    }
    
    camera.position.z = Math.max(16, n * 2.5);
    camera.position.y = 0;
    camera.position.x = 0;
    
    steps = generateTodoStepsLogic(indices, items);
    
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
