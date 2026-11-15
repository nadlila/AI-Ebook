package com.thinkerlab.backend.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;

class AiProviderServiceTest {
  @Test void openaiGeneratesWithoutCallingOtherProviders() {
    var gemini = mock(GeminiService.class);
    var openrouter = mock(OpenRouterService.class);
    var openai = mock(OpenAIService.class);
    when(openai.configured()).thenReturn(true);
    when(openai.generate("prompt", String.class)).thenReturn("OpenAI draft");
    var service = new AiProviderService("openai", gemini, openrouter, openai);
    assertThat(service.configured()).isTrue();
    assertThat(service.generate("prompt", String.class)).isEqualTo("OpenAI draft");
    verifyNoInteractions(gemini, openrouter);
    assertThat(service.researchConfigured()).isFalse();
  }
  @Test void switchingGenerationKeepsResearchOnGemini() {
    var gemini = mock(GeminiService.class);
    var openrouter = mock(OpenRouterService.class);
    when(openrouter.configured()).thenReturn(true);
    when(openrouter.generate("prompt", String.class)).thenReturn("draft");
    var service = new AiProviderService("openrouter", gemini, openrouter, mock(OpenAIService.class));
    assertThat(service.configured()).isTrue();
    assertThat(service.researchConfigured()).isFalse();
    assertThat(service.generate("prompt", String.class)).isEqualTo("draft");
    verify(gemini, never()).generate(anyString(), any());
    when(gemini.configured()).thenReturn(true);
    service.research("search");
    verify(gemini).research("search");
  }

  @Test void geminiCanBeSelectedAgainAndFailuresDoNotFallBack() {
    var gemini = mock(GeminiService.class);
    var openrouter = mock(OpenRouterService.class);
    when(gemini.generate("prompt", String.class)).thenReturn("old provider");
    assertThat(new AiProviderService("gemini", gemini, openrouter, mock(OpenAIService.class))
        .generate("prompt", String.class)).isEqualTo("old provider");
    when(openrouter.generate("prompt", String.class)).thenThrow(new IllegalStateException("offline"));
    assertThatThrownBy(() -> new AiProviderService("openrouter", gemini, openrouter, mock(OpenAIService.class))
        .generate("prompt", String.class)).isInstanceOf(IllegalStateException.class);
    verify(gemini, times(1)).generate("prompt", String.class);
    assertThatThrownBy(() -> new AiProviderService("typo", gemini, openrouter, mock(OpenAIService.class)))
        .isInstanceOf(IllegalArgumentException.class);
  }
}

