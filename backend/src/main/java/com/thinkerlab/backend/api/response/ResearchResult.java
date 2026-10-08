package com.thinkerlab.backend.api.response;

import com.thinkerlab.backend.api.request.SourceInput;
import java.util.List;

public record ResearchResult(
    List<SourceInput> sources, String searchSuggestionsHtml, List<String> queries) {}
