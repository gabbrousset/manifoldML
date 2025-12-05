<script>
    import MathBlock from "../../components/MathBlock.svelte";
    import InteractiveRegression from "../../components/InteractiveRegression.svelte";
    import IntuitionBlock from "../../components/IntuitionBlock.svelte";
    import PolynomialRegression from "../../components/PolynomialRegression.svelte";
    import GaussianLikelihood from "../../components/GaussianLikelihood.svelte";
    import CostDerivativeViz from "../../components/CostDerivativeViz.svelte";
    import ProjectionViz from "../../components/ProjectionViz.svelte";
    import BasisFunctionViz from "../../components/BasisFunctionViz.svelte";
</script>

<div class="max-w-4xl mx-auto space-y-16 pb-24 pt-10 px-6">
    <!-- Header -->
    <header class="space-y-6 border-b border-slate-200 pb-10">
        <div
            class="flex items-center space-x-2 text-sm text-indigo-600 font-mono uppercase tracking-wider"
        >
            <span>Topic 01</span>
            <span>•</span>
            <span>Supervised Learning</span>
        </div>
        <h1
            class="text-5xl font-serif font-medium text-slate-900 tracking-tight"
        >
            Linear Regression
        </h1>
        <p class="text-xl text-slate-600 leading-relaxed max-w-2xl font-light">
            Notes on the foundational algorithm of machine learning. Covering
            the linear model, deriving the normal equation via matrix calculus,
            and understanding its probabilistic roots.
        </p>
    </header>

    <!-- 1. Notation & Model -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">
            1. Notation and The Linear Model
        </h2>
        <p class="text-slate-700 leading-relaxed">
            Assume a dataset <MathBlock
                math={String.raw`\mathcal{D} = \lbrace (x^{(n)}, y^{(n)}) \rbrace ^{N}_{n=1}`}
            /> with <MathBlock math="N" /> instances. Each input <MathBlock
                math={String.raw`x^{(n)}`}
            /> is a <MathBlock math="D" />-dimensional column vector. Define the
            <strong>Design Matrix</strong>
            <MathBlock math={String.raw`X \in \mathbb{R}^{N \times D}`} />
            by concatenating all instances as rows.
        </p>

        <div class="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <MathBlock
                math={String.raw`X = \begin{pmatrix} (x^{(1)})^\top \\ (x^{(2)})^\top \\ \vdots \\ (x^{(N)})^\top \end{pmatrix} = \begin{pmatrix} x^{(1)}_1 & x^{(1)}_2 & \dots & x^{(1)}_D \\ x^{(2)}_1 & x^{(2)}_2 & \dots & x^{(2)}_D \\ \vdots & \vdots & \ddots & \vdots \\ x^{(N)}_1 & x^{(N)}_2 & \dots & x^{(N)}_D \end{pmatrix}`}
                block
            />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
                <h3
                    class="text-sm font-medium text-slate-900 uppercase tracking-wide"
                >
                    Concrete Example
                </h3>
                <p class="text-slate-600 text-sm">
                    Imagine predicting house prices (<MathBlock math="y" />)
                    based on size (<MathBlock math="x_1" />) and age (<MathBlock
                        math="x_2"
                    />). For <MathBlock math="N=3" /> houses:
                </p>
            </div>
            <div
                class="bg-slate-50 p-4 rounded border border-slate-200 text-sm"
            >
                <MathBlock
                    math={String.raw`X = \begin{pmatrix} 1 & 2100 & 5 \\ 1 & 1400 & 10 \\ 1 & 2800 & 2 \end{pmatrix}, \quad y = \begin{pmatrix} 400 \\ 250 \\ 600 \end{pmatrix}`}
                    block
                />
                <p class="mt-2 text-xs text-slate-500 text-center">
                    (Note the column of 1s for the intercept)
                </p>
            </div>
        </div>

        <p class="text-slate-700 leading-relaxed">
            The goal is to learn a weight vector <MathBlock
                math={String.raw`w \in \mathbb{R}^D`}
            /> such that the prediction function <MathBlock
                math={String.raw`f_w(x)`}
            /> approximates the target <MathBlock math="y" />. The linear model
            is defined as:
        </p>
        <div class="pl-4 border-l-4 border-indigo-500">
            <MathBlock
                math={String.raw`f_w(x) = w^\top x = w_0 + w_1 x_1 + \dots + w_D x_D`}
                block
            />
        </div>
        <div class="bg-amber-50 border-l-4 border-amber-400 p-4">
            <h3 class="font-medium text-amber-900 text-sm mb-1">
                The Bias Trick (Intercept)
            </h3>
            <p class="text-amber-800 text-sm leading-relaxed">
                The term <MathBlock math="w_0" /> allows the line to not pass through
                the origin. To simplify notation, we augment the input vector <MathBlock
                    math="x"
                /> with a <MathBlock math="1" />
                (i.e., <MathBlock math="x_0 = 1" />). This absorbs the bias into
                the dot product:
                <MathBlock
                    math={String.raw`w^\top x = \sum_{j=0}^D w_j x_j`}
                />.
            </p>
        </div>

        <IntuitionBlock title="What are the weights really?">
            <p class="mb-4">
                Think of the weights <MathBlock math="w" /> as a "filter" or "template"
                that we match against the input <MathBlock math="x" />.
            </p>
            <p class="mb-4">
                Mathematically, <MathBlock math="w^\top x" /> is a
                <strong>dot product</strong>. The dot product measures
                <em>similarity</em>
                (or projection). If <MathBlock math="w" /> and <MathBlock
                    math="x"
                /> point in the same direction, the value is large. If they are orthogonal
                (90 degrees), the value is zero.
            </p>
            <p>
                So, linear regression is essentially asking: "How similar is
                this input to my learned template?"
                <MathBlock math="w_0" /> (the bias) just sets the baseline activation
                when the input is zero.
            </p>
        </IntuitionBlock>
    </section>

    <!-- 2. The Cost Function -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">
            2. The Cost Function
        </h2>
        <p class="text-slate-700 leading-relaxed">
            To find the optimal <MathBlock math="w" />, we minimize the residual
            sum of squares. Define the <strong>Cost Function</strong>
            <MathBlock math="J(w)" />
            (also known as the Loss Function) as:
        </p>
        <MathBlock
            math={String.raw`J(w) = \frac{1}{2} \sum_{n=1}^{N} (y^{(n)} - w^\top x^{(n)})^2 = \frac{1}{2} ||y - Xw||^2`}
            block
        />
        <p class="text-slate-700 leading-relaxed">
            The factor of <MathBlock math={String.raw`\frac{1}{2}`} /> is included
            for mathematical convenience, as it cancels out when taking the derivative.
        </p>

        <IntuitionBlock title="Why squared error? (Geometric Intuition)">
            <p class="mb-4">
                Why not absolute error <MathBlock
                    math={String.raw`|y - \hat{y}|`}
                />? Or cubic error?
            </p>
            <p class="text-slate-700 leading-relaxed mb-6">
                Geometrically, minimizing the squared error is equivalent to
                finding the <strong>orthogonal projection</strong> of the target
                vector
                <MathBlock math="y" /> onto the subspace (plane) spanned by the columns
                of <MathBlock math="X" />. It's the "shortest path" from the
                data vector to the plane of possible predictions.
            </p>

            <div class="my-8">
                <ProjectionViz />
            </div>
            <p>
                <strong>2. Penalizing Outliers:</strong> Squaring punishes large
                errors disproportionately. An error of 2 is
                <strong>4 times</strong> worse than an error of 1. This forces the
                model to pay attention to outliers (which can be both good and bad!).
            </p>
        </IntuitionBlock>

        <div class="my-8">
            <h3 class="text-lg font-medium text-slate-900 mb-4">
                Interactive Visualization: Minimizing Residuals
            </h3>
            <p class="text-slate-600 mb-6">
                The red dashed lines represent the <strong>residuals</strong>
                (<MathBlock math={String.raw`y^{(n)} - \hat{y}^{(n)}`} />). The
                cost <MathBlock math="J(w)" /> is proportional to the sum of the
                squared lengths of these lines. Try adding points to see how the
                Ordinary Least Squares (OLS) solution adapts to minimize this total
                squared error.
            </p>
            <InteractiveRegression />
        </div>

        <div class="my-8">
            <h3 class="text-lg font-medium text-slate-900 mb-4">
                Visualizing the Cost and Derivative
            </h3>
            <p class="text-slate-600 mb-6">
                The cost function <MathBlock math="J(w)" /> is a parabola. To find
                the minimum, we look for where the slope (derivative) is zero.
            </p>
            <CostDerivativeViz />
        </div>
    </section>

    <!-- 3. Derivation of Normal Equation -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">
            3. Derivation of the Normal Equation
        </h2>
        <p class="text-slate-700 leading-relaxed">
            Since <MathBlock math="J(w)" /> is a convex function, find the global
            minimum by setting its gradient <MathBlock
                math={String.raw`\nabla_w J(w)`}
            /> to zero. Let's derive the closed-form solution, known as the
            <strong>Normal Equation</strong>.
        </p>

        <IntuitionBlock title="The Orthogonality Principle">
            <p class="mb-4">
                Before doing the calculus, let's use our geometric intuition.
            </p>
            <p>
                We want the error vector <MathBlock math="e = y - Xw" /> to be as
                small as possible. Geometrically, the shortest vector from <MathBlock
                    math="y"
                /> to the plane <MathBlock math="Xw" /> is the one that is
                <strong>perpendicular</strong>
                (orthogonal) to the plane. This means <MathBlock
                    math="X^\top e = 0"
                />. Expanding this gives <MathBlock
                    math="X^\top (y - Xw) = 0"
                />, which directly leads to the normal equation!
            </p>
        </IntuitionBlock>

        <div
            class="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-800"
        >
            <p>
                <strong>Step 1:</strong> Expand the matrix form of the cost function.
            </p>
            <MathBlock
                math={String.raw`\begin{aligned} 
        J(w) &= \frac{1}{2} (y - Xw)^\top (y - Xw) \\
             &= \frac{1}{2} (y^\top - w^\top X^\top) (y - Xw) \\
             &= \frac{1}{2} (y^\top y - y^\top Xw - w^\top X^\top y + w^\top X^\top Xw) 
    \end{aligned}`}
                block
            />

            <p>
                <strong>Step 2:</strong> Simplify. Note that <MathBlock
                    math={String.raw`y^\top Xw`}
                /> is a scalar, so it equals its transpose <MathBlock
                    math={String.raw`(y^\top Xw)^\top = w^\top X^\top y`}
                />.
            </p>
            <MathBlock
                math={String.raw`J(w) = \frac{1}{2} (y^\top y - 2w^\top X^\top y + w^\top X^\top Xw)`}
                block
            />

            <p>
                <strong>Step 3:</strong> Take the gradient with respect to <MathBlock
                    math="w"
                />.
            </p>
            <MathBlock
                math={String.raw`\nabla_w J(w) = -X^\top y + X^\top X w`}
                block
            />

            <p>
                <strong>Step 4:</strong> Set to zero and solve for <MathBlock
                    math="w"
                />.
            </p>
            <MathBlock
                math={String.raw`\begin{aligned}
        -X^\top y + X^\top X w &= 0 \\
        X^\top X w &= X^\top y \\
        w^* &= (X^\top X)^{-1} X^\top y
    \end{aligned}`}
                block
            />

            <div class="mt-4 pt-4 border-t border-slate-200">
                <p class="font-medium text-slate-900 mb-2">
                    Intuition for the Normal Equation
                </p>
                <p class="text-sm text-slate-600 mb-2">
                    Why is it called the <strong>"Normal"</strong> Equation?
                </p>
                <p class="text-sm text-slate-600 mb-2">
                    Geometrically, the residual vector <MathBlock
                        math="e = y - Xw"
                    /> is the error. To minimize the error length, the residual vector
                    must be <strong>orthogonal</strong> (or "normal") to the
                    subspace spanned by the columns of <MathBlock math="X" />.
                </p>
                <p class="text-sm text-slate-600 mb-2">
                    This orthogonality condition is written as <MathBlock
                        math="X^\top (y - Xw) = 0"
                    />, which directly leads to <MathBlock
                        math="X^\top y = X^\top X w"
                    />.
                </p>
                <p class="text-sm text-slate-600 mb-2 mt-4">
                    Let's break down the terms:
                </p>
                <ul
                    class="list-disc list-inside text-sm text-slate-600 space-y-1 ml-2"
                >
                    <li>
                        <MathBlock math="X^\top y" /> represents the correlation
                        between each feature and the target. It's asking: "How much
                        does feature <MathBlock math="j" /> align with the target
                        <MathBlock math="y" />?"
                    </li>
                    <li>
                        <MathBlock math="X^\top X" /> is the
                        <strong>Gram Matrix</strong>
                        (or covariance matrix, roughly). It measures how features
                        correlate with <em>each other</em>.
                    </li>
                    <li>
                        So the equation says: The weights <MathBlock math="w" />
                        must account for feature correlations (<MathBlock
                            math="X^\top X"
                        />) to match the feature-target correlations (<MathBlock
                            math="X^\top y"
                        />).
                    </li>
                    <li>
                        Multiplying by <MathBlock math="(X^\top X)^{-1}" /> effectively
                        "decorrelates" the features to find the true independent
                        contribution of each one.
                    </li>
                </ul>
            </div>
        </div>

        <div class="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p class="text-indigo-900 font-medium">
                Result: The Normal Equation
            </p>
            <MathBlock
                math={String.raw`w^* = (X^\top X)^{-1} X^\top y`}
                block
            />
        </div>

        <div class="mt-8 pt-8 border-t border-slate-200">
            <h3 class="text-lg font-medium text-slate-900 mb-4">
                Note: The Pseudo-Inverse
            </h3>
            <p class="text-slate-700 leading-relaxed mb-4">
                The term <MathBlock math={String.raw`(X^\top X)^{-1} X^\top`} />
                is often denoted as <MathBlock math={String.raw`X^\dagger`} /> (X-dagger),
                the <strong>Moore-Penrose Pseudo-Inverse</strong>.
            </p>
            <p class="text-slate-700 leading-relaxed">
                It generalizes the matrix inverse to non-square matrices. Even
                if <MathBlock math={String.raw`X^\top X`} /> is not invertible (singular),
                we can still compute <MathBlock math={String.raw`X^\dagger`} />
                using SVD (Singular Value Decomposition) to find the unique minimum-norm
                solution.
            </p>
        </div>

        <div class="mt-8 pt-8 border-t border-slate-200">
            <h3 class="text-lg font-medium text-slate-900 mb-4">
                Extension: Multiple Targets
            </h3>
            <p class="text-slate-700 leading-relaxed mb-4">
                If we want to predict multiple outputs (e.g., House Price AND
                Days on Market), <MathBlock math="y" /> becomes a matrix <MathBlock
                    math={String.raw`Y \in \mathbb{R}^{N \times K}`}
                />.
            </p>
            <MathBlock
                math={String.raw`Y = \begin{pmatrix} 400 & 30 \\ 250 & 45 \\ 600 & 15 \end{pmatrix}`}
                block
            />
            <p class="text-slate-700 leading-relaxed mt-4 mb-4">
                The weights become a matrix <MathBlock
                    math={String.raw`W \in \mathbb{R}^{D \times K}`}
                />. The math remains exactly the same:
            </p>
            <MathBlock
                math={String.raw`W^* = (X^\top X)^{-1} X^\top Y`}
                block
            />
        </div>
    </section>

    <!-- 4. Probabilistic Interpretation -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">
            4. Probabilistic Interpretation
        </h2>
        <p class="text-slate-700 leading-relaxed">
            Why do we use the squared error? It turns out that minimizing the
            squared error is equivalent to
            <strong>Maximum Likelihood Estimation (MLE)</strong> under the assumption
            of Gaussian noise.
        </p>
        <p class="text-slate-700 leading-relaxed">
            Assume the target <MathBlock math="y" /> is generated by a deterministic
            linear function plus random Gaussian noise <MathBlock
                math="\epsilon"
            />:
        </p>
        <MathBlock
            math={String.raw`y^{(n)} = w^\top x^{(n)} + \epsilon^{(n)}, \quad \text{where } \epsilon^{(n)} \sim \mathcal{N}(0, \sigma^2)`}
            block
        />
        <p class="text-slate-700 leading-relaxed">
            This implies that given <MathBlock math="x" />, <MathBlock
                math="y"
            /> follows a Gaussian distribution:
        </p>
        <MathBlock
            math={String.raw`p(y^{(n)} | x^{(n)}; w) = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left( -\frac{(y^{(n)} - w^\top x^{(n)})^2}{2\sigma^2} \right)`}
            block
        />

        <IntuitionBlock title="Why Gaussian Noise?">
            <p class="mb-4">
                Why assume the noise is Gaussian? Why not uniform or Laplacian?
            </p>
            <p>
                <strong>Central Limit Theorem:</strong> In nature, errors are often
                the sum of many small, independent random factors (e.g., sensor noise,
                temperature fluctuations, measurement errors). The CLT states that
                the sum of many independent random variables tends toward a Gaussian
                distribution. So, assuming Gaussian noise is usually the safest and
                most natural choice.
            </p>
        </IntuitionBlock>

        <div class="my-8">
            <h3 class="text-lg font-medium text-slate-900 mb-4">
                Interactive: Maximum Likelihood
            </h3>
            <p class="text-slate-600 mb-6">
                In this visualization, the green curves represent the
                probability distribution <MathBlock math="p(y|x;w)" /> for each point.
                The horizontal green bars show the <strong>likelihood</strong>
                of observing the actual data point <MathBlock math="y" /> given the
                current line.
                <br /><br />
                <strong>Goal:</strong> Adjust the line to maximize the total length
                of the green bars (likelihood). Notice how this naturally minimizes
                the distance between the points and the line!
            </p>
            <GaussianLikelihood />
        </div>

        <p class="text-slate-700 leading-relaxed">
            The likelihood of the entire dataset is the product of individual
            probabilities (assuming i.i.d.):
        </p>
        <MathBlock
            math={String.raw`L(w) = \prod_{n=1}^{N} p(y^{(n)} | x^{(n)}; w)`}
            block
        />
        <p class="text-slate-700 leading-relaxed">
            Maximizing the Log-Likelihood <MathBlock
                math={String.raw`\ell(w) = \log L(w)`}
            /> is equivalent to minimizing the negative term in the exponent, which
            is exactly the sum of squared errors <MathBlock
                math={String.raw`\sum (y^{(n)} - w^\top x^{(n)})^2`}
            />.
        </p>
    </section>

    <!-- 5. Deep Dive / Prompts -->
    <section class="space-y-8 border-t border-slate-200 pt-10">
        <h2 class="text-2xl font-semibold text-slate-900">
            Deep Dive & Prompts
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4 md:col-span-2">
                <h3 class="text-lg font-medium text-slate-900">
                    Non-Linear Basis Functions
                </h3>
                <p class="text-slate-600 text-sm leading-relaxed">
                    Linear regression is "linear" in the parameters <MathBlock
                        math="w"
                    />, not necessarily the input <MathBlock math="x" />. We can
                    fit non-linear data by transforming <MathBlock math="x" /> using
                    a basis function <MathBlock math={String.raw`\phi(x)`} />.
                </p>

                <div
                    class="bg-slate-50 p-6 rounded-lg border border-slate-200 my-6"
                >
                    <h4 class="text-sm font-medium text-slate-900 mb-4">
                        Visualizing the Transformation
                    </h4>
                    <BasisFunctionViz />
                </div>

                <p class="text-slate-600 text-sm leading-relaxed">
                    For example, polynomial regression uses <MathBlock
                        math={String.raw`\phi(x) = [1, x, x^2, \dots]`}
                    />. The model becomes <MathBlock
                        math={String.raw`y = w^\top \phi(x)`}
                    />, which is still linear in <MathBlock math="w" />.
                </p>
                <p class="text-slate-600 text-sm leading-relaxed mt-2">
                    <strong>Feature Engineering:</strong> This is powerful. We
                    can manually create features like <MathBlock
                        math="x_1 \cdot x_2"
                    /> (interaction) or <MathBlock math="\sin(x_1)" /> to capture
                    complex relationships while keeping the optimization problem
                    convex and easy to solve.
                </p>
                <div class="mt-4">
                    <PolynomialRegression />
                </div>
            </div>

            <div class="space-y-4 md:col-span-2">
                <h3 class="text-lg font-medium text-slate-900">
                    Matrix Differentiation
                </h3>
                <p class="text-slate-600 text-sm leading-relaxed">
                    Key identities used in our derivation:
                </p>
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200"
                >
                    <MathBlock
                        math={String.raw`\nabla_w (w^\top A w) = (A + A^\top)w`}
                    />
                    <MathBlock math={String.raw`\nabla_w (w^\top b) = b`} />
                </div>
            </div>
        </div>
    </section>
</div>
