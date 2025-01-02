5.1
Procedure for the LLM Dataset Inference
We describe the procedure for LLM dataset inference in four stages (see also visualization in Figure 1).
Recall the initial example of a book writer who suspects that a portion of their books was trained on. We
use this as a running example to describe the four stages of LLM dataset inference.
Stage 0: Victim approaches an LLM provider.
A victim (author) V approaches an arbiter with a
claim of ownership over data (book) that they suspect a model trainer or adversary S utilized. This stage
involves the arbiter validating if the claim by V satisfies the assumptions under which dataset inference
operates, that is, they provide an IID set of data that they suspect was trained on, and an equivalent
dataset that S could not have seen, denoted as the validation set. This can, for instance, happen when
authors have multiple drafts of a book chapter, and only one of the drafts makes it to the actual print. In
such a case, V
claims that S
trained on the published version of their book, because fθ (S) responds
differently to the final versus rejected drafts of the book. Both suspect and validation sets are divided into
non-overlapping splits (partitions) A and B. We will use Aval, Asus in Stages 1, 2 and Bval, Bsus in Stage 3
to actually perform the ownership assessment.
Stage 1: Aggregate Features with MIAs.
This step involves aggregating scores from various MIA
methods described in the previous Section 2.1. Aval, Asus sets are passed through the LLM under question
to obtain their features derived from MIAs. Note that we use an aggregation of all the MIA methods
discussed in the previous sections to create a single feature vector. In the next step, we will determine
which MIAs are useful for identifying dataset membership for the given distribution.
Stage 2: Learn MIA correlations.
In this stage, we train a linear regressor to learn the importance of
weights for different MIA attacks to use for the final dataset inference procedure. Across each MIA feature
value, we first modify the top 5% outliers by changing their values to the mean of the distribution. This
step is crucial to prevent issues in Step 3, where the model might learn skewed correlations due to a few
outlier samples. We then pass the data through a linear regression model to learn weights for each feature.
All ‘suspect’ samples in Asus are labeled as 0, and all validation samples in Aval are labeled as 1. A regressor
is trained to predict the label given the samples, effectively learning the correlation between the features
and their membership status.
Stage 3: Perform Dataset Inference.
We use B splits of the suspect and validation sets, holding
out up to 1000 samples in these splits for ownership assessment. Each sample is assigned a membership
value using a trained linear classifier. These values are used to perform a statistical t-test to determine
if the suspect set was used in training the model. We then report whether the model was trained on the
suspect dataset based on the t-test results. For members of the suspect set, their confidence scores are
significantly closer to 0 compared to non-members. The null hypothesis (H0) is that the suspect dataset
was not used for training. Assume that µM(Bsus) and µM(Bval) are the mean membership values of the
suspect and validation sets, respectively. Then, H0 and H1 (alternate hypothesis) are:
H0 : µM(Bsus) ≥µM(Bval);
H1 : µM(Bsus) ≤µM(Bval).
(1)
Combining p-values for Dependent Tests.
In order to assess the significance of the results, we
performed multiple t-tests using 10 different random seeds to obtain various splits of examples between
A and B sets. Since the subsets had overlapping examples, the statistical tests are dependent [Vovk and
Wang, 2020], and p-values must be aggregated accordingly [Brown, 1975, Kost and McDermott, 2002, Meng,
1994, Rüschendorf, 1982] . Let p1, p2, . . . , pn denote the p-values obtained from the n t-tests performed with
different random seeds. Under the null hypothesis, each p-value is uniformly distributed on the interval
[0, 1]. We approximate the combined p-value by:
pcombined = 1 −exp
 n
X
i=1
log(1 −pi)
!
(2)
8
