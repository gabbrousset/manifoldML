<script>
    import MathBlock from '../../components/MathBlock.svelte';
    import InteractiveRegression from '../../components/InteractiveRegression.svelte';
</script>

<div class="max-w-4xl mx-auto space-y-16 pb-24 pt-10 px-6">
    <!-- Header -->
    <header class="space-y-6 border-b border-slate-200 pb-10">
        <div class="flex items-center space-x-2 text-sm text-indigo-600 font-mono uppercase tracking-wider">
            <span>Topic 01</span>
            <span>•</span>
            <span>Supervised Learning</span>
        </div>
        <h1 class="text-5xl font-serif font-medium text-slate-900 tracking-tight">Linear Regression</h1>
        <p class="text-xl text-slate-600 leading-relaxed max-w-2xl font-light">
            The foundational algorithm of machine learning. We explore the linear model,
            derive the normal equation via matrix calculus, and understand its probabilistic roots.
        </p>
    </header>

    <!-- 1. Notation & Model -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">1. Notation and The Linear Model</h2>
        <p class="text-slate-700 leading-relaxed">
            We assume a dataset <MathBlock math={String.raw`\mathcal{D} = \lbrace (x^{(n)}, y^{(n)}) \rbrace ^{N}_{n=1}`} /> with <MathBlock math="N" /> instances.
            Each input <MathBlock math={String.raw`x^{(n)}`} /> is a <MathBlock math="D" />-dimensional column vector. We define the <strong>Design Matrix</strong> <MathBlock math={String.raw`X \in \mathbb{R}^{N \times D}`} />
            by concatenating all instances as rows.
        </p>

        <div class="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <MathBlock math={String.raw`X = \begin{pmatrix} (x^{(1)})^\top \\ (x^{(2)})^\top \\ \vdots \\ (x^{(N)})^\top \end{pmatrix}`} block />
        </div>

        <p class="text-slate-700 leading-relaxed">
            Our goal is to learn a weight vector <MathBlock math={String.raw`w \in \mathbb{R}^D`} /> such that our prediction function <MathBlock math={String.raw`f_w(x)`} /> approximates the target <MathBlock math="y" />.
            The linear model is defined as:
        </p>
        <div class="pl-4 border-l-4 border-indigo-500">
            <MathBlock math={String.raw`f_w(x) = w^\top x = w_0 + w_1 x_1 + \dots + w_D x_D`} block />
        </div>
        <p class="text-sm text-slate-500 italic">
            Note: We often include a bias term <MathBlock math="w_0" /> by augmenting <MathBlock math="x" /> with a <MathBlock math="1" /> (i.e., <MathBlock math="x_0 = 1" />).
        </p>
    </section>

    <!-- 2. The Cost Function -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">2. The Cost Function</h2>
        <p class="text-slate-700 leading-relaxed">
            To find the optimal <MathBlock math="w" />, we minimize the residual sum of squares. We define the <strong>Cost Function</strong> <MathBlock math="J(w)" />
            (also known as the Loss Function) as:
        </p>
        <MathBlock math={String.raw`J(w) = \frac{1}{2} \sum_{n=1}^{N} (y^{(n)} - w^\top x^{(n)})^2 = \frac{1}{2} ||y - Xw||^2`} block />
        <p class="text-slate-700 leading-relaxed">
            The factor of <MathBlock math={String.raw`\frac{1}{2}`} /> is included for mathematical convenience, as it cancels out when taking the derivative.
        </p>

        <div class="my-8">
            <h3 class="text-lg font-medium text-slate-900 mb-4">Interactive Visualization: Minimizing Residuals</h3>
            <p class="text-slate-600 mb-6">
                The red dashed lines represent the <strong>residuals</strong> (<MathBlock math={String.raw`y^{(n)} - \hat{y}^{(n)}`} />).
                The cost <MathBlock math="J(w)" /> is proportional to the sum of the squared lengths of these lines.
                Try adding points to see how the Ordinary Least Squares (OLS) solution adapts to minimize this total squared error.
            </p>
            <InteractiveRegression />
        </div>
    </section>

    <!-- 3. Derivation of Normal Equation -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">3. Derivation of the Normal Equation</h2>
        <p class="text-slate-700 leading-relaxed">
            Since <MathBlock math="J(w)" /> is a convex function, we can find the global minimum by setting its gradient <MathBlock math={String.raw`\nabla_w J(w)`} /> to zero.
            Let's derive the closed-form solution, known as the <strong>Normal Equation</strong>.
        </p>

        <div class="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-800">
            <p><strong>Step 1:</strong> Expand the matrix form of the cost function.</p>
            <MathBlock math={String.raw`\begin{aligned} 
        J(w) &= \frac{1}{2} (y - Xw)^\top (y - Xw) \\
             &= \frac{1}{2} (y^\top - w^\top X^\top) (y - Xw) \\
             &= \frac{1}{2} (y^\top y - y^\top Xw - w^\top X^\top y + w^\top X^\top Xw) 
    \end{aligned}`} block />

            <p><strong>Step 2:</strong> Simplify. Note that <MathBlock math={String.raw`y^\top Xw`} /> is a scalar, so it equals its transpose <MathBlock math={String.raw`(y^\top Xw)^\top = w^\top X^\top y`} />.</p>
            <MathBlock math={String.raw`J(w) = \frac{1}{2} (y^\top y - 2w^\top X^\top y + w^\top X^\top Xw)`} block />

            <p><strong>Step 3:</strong> Take the gradient with respect to <MathBlock math="w" />.</p>
            <MathBlock math={String.raw`\nabla_w J(w) = -X^\top y + X^\top X w`} block />

            <p><strong>Step 4:</strong> Set to zero and solve for <MathBlock math="w" />.</p>
            <MathBlock math={String.raw`\begin{aligned}
        -X^\top y + X^\top X w &= 0 \\
        X^\top X w &= X^\top y \\
        w^* &= (X^\top X)^{-1} X^\top y
    \end{aligned}`} block />
        </div>

        <div class="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p class="text-indigo-900 font-medium">Result: The Normal Equation</p>
            <MathBlock math={String.raw`w^* = (X^\top X)^{-1} X^\top y`} block />
        </div>
    </section>

    <!-- 4. Probabilistic Interpretation -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">4. Probabilistic Interpretation</h2>
        <p class="text-slate-700 leading-relaxed">
            Why do we use the squared error? It turns out that minimizing the squared error is equivalent to
            <strong>Maximum Likelihood Estimation (MLE)</strong> under the assumption of Gaussian noise.
        </p>
        <p class="text-slate-700 leading-relaxed">
            Assume the target <MathBlock math="y" /> is generated by a deterministic linear function plus random Gaussian noise <MathBlock math="\epsilon" />:
        </p>
        <MathBlock math={String.raw`y^{(n)} = w^\top x^{(n)} + \epsilon^{(n)}, \quad \text{where } \epsilon^{(n)} \sim \mathcal{N}(0, \sigma^2)`} block />
        <p class="text-slate-700 leading-relaxed">
            This implies that given <MathBlock math="x" />, <MathBlock math="y" /> follows a Gaussian distribution:
        </p>
        <MathBlock math={String.raw`p(y^{(n)} | x^{(n)}; w) = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left( -\frac{(y^{(n)} - w^\top x^{(n)})^2}{2\sigma^2} \right)`} block />
        <p class="text-slate-700 leading-relaxed">
            The likelihood of the entire dataset is the product of individual probabilities (assuming i.i.d.):
        </p>
        <MathBlock math={String.raw`L(w) = \prod_{n=1}^{N} p(y^{(n)} | x^{(n)}; w)`} block />
        <p class="text-slate-700 leading-relaxed">
            Maximizing the Log-Likelihood <MathBlock math={String.raw`\ell(w) = \log L(w)`} /> is equivalent to minimizing the negative term in the exponent,
            which is exactly the sum of squared errors <MathBlock math={String.raw`\sum (y^{(n)} - w^\top x^{(n)})^2`} />.
        </p>
    </section>

    <!-- 5. Deep Dive / Prompts -->
    <section class="space-y-8 border-t border-slate-200 pt-10">
        <h2 class="text-2xl font-semibold text-slate-900">Deep Dive & Prompts</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
                <h3 class="text-lg font-medium text-slate-900">The Pseudo-Inverse</h3>
                <p class="text-slate-600 text-sm leading-relaxed">
                    In the Normal Equation, the term <MathBlock math={String.raw`(X^\top X)^{-1} X^\top`} /> is often denoted as <MathBlock math={String.raw`X^\dagger`} /> (X-dagger),
                    the <strong>Moore-Penrose Pseudo-Inverse</strong>. It generalizes the concept of a matrix inverse to non-square matrices.
                    If <MathBlock math={String.raw`X^\top X`} /> is not invertible (singular), we can still solve for <MathBlock math="w" /> using SVD (Singular Value Decomposition).
                </p>
            </div>

            <div class="space-y-4">
                <h3 class="text-lg font-medium text-slate-900">Non-Linear Basis Functions</h3>
                <p class="text-slate-600 text-sm leading-relaxed">
                    Linear regression is "linear" in the parameters <MathBlock math="w" />, not necessarily the input <MathBlock math="x" />.
                    We can fit non-linear data by transforming <MathBlock math="x" /> using a basis function <MathBlock math={String.raw`\phi(x)`} />.
                    For example, polynomial regression uses <MathBlock math={String.raw`\phi(x) = [1, x, x^2, \dots]`} />.
                    The model becomes <MathBlock math={String.raw`y = w^\top \phi(x)`} />, which is still linear in <MathBlock math="w" />.
                </p>
            </div>

            <div class="space-y-4 md:col-span-2">
                <h3 class="text-lg font-medium text-slate-900">Matrix Differentiation</h3>
                <p class="text-slate-600 text-sm leading-relaxed">
                    Key identities used in our derivation:
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <MathBlock math={String.raw`\nabla_w (w^\top A w) = (A + A^\top)w`} />
                    <MathBlock math={String.raw`\nabla_w (w^\top b) = b`} />
                </div>
            </div>
        </div>
    </section>
</div>
