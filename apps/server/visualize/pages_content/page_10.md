6
Discussions
Membership Inference for LLMs.
In this work, we question the central foundations of research on
membership inference in the context of LLMs trained on trillions of tokens of web data. Our findings indicate
that current membership inference attacks for LLMs are as good as random guessing. We demonstrate that
past successes in MIAs are often due to specific experimental confounders rather than inherent vulnerabilities.
We provide guidelines for future researchers to conduct robust experiments, emphasizing the use of IID
splits, considering various data distributions, assessing false positives, and using multiple random seeds to
avoid confounders.
Shift to LLM Dataset Inference.
Historically, membership inference focused on whether an individual
data point was part of a training dataset. Instead, we aggregate multiple data points from individual
entities, forming what we now consider a dataset. In our work, we have not only put thought towards the
scientific framework of dataset inference but also the ways it will operationalize in real-world settings, for
instance, through our running example of a writer who suspects that their books were trained on. Our
research demonstrates that LLM dataset inference is effective in minimizing false positives and detecting
even minute differences between training and test splits of IID samples.
Limitations
A central limitation to dataset inference is the assumptions under which it can be performed.
More specifically, we require that the training and validation sets must be IID, and the validation set must
be completely private to the victim. While this may appear elusive a priori, we outline concrete scenarios to
show how these sets naturally occur. For instance, through multiple drafts of a book, until one gets finalized.
The same applies to many artistic and creative uses of LLMs across language and vision today. In terms of
data and model access, we assume that the victim or a trusted third party, such as law enforcement, is
responsible for running the dataset inference so that there are no privacy-related concerns. This will require
the necessary legal framework to be brought in place, or otherwise suspect adversaries may deny querying
their model altogether.
7
Acknowledgements
We would like to acknowledge our sponsors, who support our research with financial and in-kind contributions:
Amazon, Apple, CIFAR through the Canada CIFAR AI Chair, Meta, NSERC through the Discovery Grant
and an Alliance Grant with ServiceNow and DRDC, the Ontario Early Researcher Award, the Schmidt
Sciences foundation through the AI2050 Early Career Fellow program, and the Sloan Foundation. Resources
used in preparing this research were provided, in part, by the Province of Ontario, the Government of
Canada through CIFAR, and companies sponsoring the Vector Institute. Pratyush Maini was supported by
DARPA GARD Contract HR00112020006.