Abstract

The proliferation of large language models (LLMs) in the real world has come with a rise in copyright
cases against companies for training their models on unlicensed data from the internet. Recent works
have presented methods to identify if individual text sequences were members of the model’s training
data, known as membership inference attacks (MIAs). We demonstrate that the apparent success of
these MIAs is confounded by selecting non-members (text sequences not used for training) belonging to
a different distribution from the members (e.g., temporally shifted recent Wikipedia articles compared
with ones used to train the model). This distribution shift makes membership inference appear successful.
However, most MIA methods perform no better than random guessing when discriminating between
members and non-members from the same distribution (e.g., in this case, the same period of time).
Even when MIAs work, we find that different MIAs succeed at inferring membership of samples from
different distributions. Instead, we propose a new dataset inference method to accurately identify
the datasets used to train large language models. This paradigm sits realistically in the modern-day
copyright landscape, where authors claim that an LLM is trained over multiple documents (such as a
book) written by them, rather than one particular paragraph. While dataset inference shares many
of the challenges of membership inference, we solve it by selectively combining the MIAs that provide
positive signal for a given distribution, and aggregating them to perform a statistical test on a given
dataset. Our approach successfully distinguishes the train and test sets of different subsets of the Pile
with statistically significant p-values < 0.1, without any false positives.
1
Introduction
Training of large language models (LLMs) on large scrapes of the web [Gem, Ope] has recently raised
significant privacy concerns [Rahman and Santacana, 2023, Wu et al., 2023]. The inclusion of personally
identifiable information (PII) and copyrighted material in the training corpora has led to legal challenges,
notably the lawsuit between The New York Times and OpenAI [Gry, 2023], among others [Bak, 2023,
Sil, 2023]. Such cases highlight the issue of using copyrighted content without attribution and/or license.
Potentially, they undermine the rights of creators and disincentivize future artistic endeavors due to the lack
of monetary compensation for works freely accessible online. This backdrop sets the stage for the technical
challenge of identifying training data within machine learning models [Maini et al., 2021, Shokri et al.,
2017]. Despite legal ambiguities, the task holds critical importance for understanding LLMs’ operations and
ensuring data accountability.
Membership inference [Shokri et al., 2017] is a long-studied privacy problem, intending to infer if a given
data point was included in the training data of a model. However, identifying example membership is a
challenging task even for models trained on small datasets Carlini et al. [2022], Duan et al. [2023], and
∗Equal contribution. Code is available at https://github.com/pratyushmaini/llm_dataset_inference/.
1
arXiv:2406.06443v1  [cs.LG]  10 Jun 2024
