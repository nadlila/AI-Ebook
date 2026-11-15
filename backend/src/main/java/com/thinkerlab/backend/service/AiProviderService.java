package com.thinkerlab.backend.service;

import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Selects draft generation explicitly; grounded web research stays on Gemini. */
@Service
public class AiProviderService {
  private final String provider;
  private final GeminiService gemini;
  private final OpenRouterService openrouter;
  private final OpenAIService openai;

  public AiProviderService(@Value("${app.ai.provider:gemini}") String provider,
      GeminiService gemini, OpenRouterService openrouter, OpenAIService openai) {
    this.provider = provider.trim().toLowerCase(Locale.ROOT);
    if (!this.provider.equals("gemini") && !this.provider.equals("openrouter") && !this.provider.equals("openai"))
      throw new IllegalArgumentException("AI_PROVIDER harus gemini, openrouter, atau openai.");
    this.gemini = gemini;
    this.openrouter = openrouter;
    this.openai = openai;
  }

  public boolean configured() {
    if (provider.equals("openai")) return openai.configured();
    return provider.equals("openrouter") ? openrouter.configured() : gemini.configured();
  }

  public boolean researchConfigured() { return gemini.configured(); }

  public <T> T generate(String prompt, Class<T> type) {
    if (provider.equals("openai")) return openai.generate(prompt, type);
    return provider.equals("openrouter")
        ? openrouter.generate(prompt, type) : gemini.generate(prompt, type);
  }

  public com.thinkerlab.backend.api.response.ResearchResult research(String prompt) {
    if (!researchConfigured())
      throw ProjectService.error(HttpStatus.SERVICE_UNAVAILABLE,
          "Riset web masih memakai Gemini. Atur GEMINI_API_KEY atau gunakan sumber manual.");
    return gemini.research(prompt);
  }
}
