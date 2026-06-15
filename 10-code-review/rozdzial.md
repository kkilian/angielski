# Code review po angielsku / Code Review

## Grupa 1
| polski | angielski |
|---|---|
| drobna uwaga / czepialstwo (w review) | nit (a minor comment) |
| Drobna uwaga: literówka w nazwie. | Nit: typo in the name. |
| Drobnostka: brakuje tu spacji. | Nit: missing a space here. |
| Czepiam się: ta nazwa mogłaby być jaśniejsza. | Nit: this name could be clearer. |
| Drobiazg: przeniósłbym to wyżej. | Nit: I'd move this up. |
| nie blokuję tym, ale… | not a blocker, but… |
| (sztywno) To nie jest problem krytyczny, ale… | This isn't critical, but… |
| (luźno) Nie blokuję tym, ale przydałby się komentarz. | Not a blocker, but a comment here would help. |
| spokojnie zignoruj / wedle uznania | feel free to ignore |
| To tylko sugestia, spokojnie zignoruj. | Just a suggestion, feel free to ignore. |
| poza zakresem, ale… | out of scope, but… |
| Poza zakresem tego PR-a, ale kiedyś warto to ogarnąć. | Out of scope for this PR, but worth cleaning up at some point. |
| Drobiazg, nie blokuję: ta nazwa mogłaby być jaśniejsza — ale spokojnie zignoruj, jeśli się nie zgadzasz. | Nit, not a blocker: this name could be clearer — but feel free to ignore if you disagree. |

## Grupa 2
| polski | angielski |
|---|---|
| objaśnisz mi to krok po kroku? | can you walk me through this? |
| Objaśnisz mi tę funkcję? | Can you walk me through this function? |
| Przeprowadzisz mnie przez tę logikę? | Can you walk me through the logic here? |
| Wytłumaczysz, czemu jest tu pętla? | Can you walk me through why there's a loop here? |
| jaki jest powód, że…? / czemu akurat tak? | what's the reasoning behind…? |
| Jaki jest powód, żeby robić to w ten sposób? | What's the reasoning behind doing it this way? |
| (sztywno) Nie rozumiem tego fragmentu. | I don't understand this part. |
| (luźno) Może czegoś nie widzę, ale… | I might be missing something, but… |
| pomóż mi zrozumieć… | help me understand… |
| Pomóż mi zrozumieć, czemu nie ma tu cache'a. | Help me understand why there's no caching here. |
| może czegoś nie widzę — co tu się dzieje? | I might be missing something — what's going on here? |
| Może czegoś nie widzę, ale jaki jest powód tej pętli? Objaśnisz mi to? | I might be missing something, but what's the reasoning behind this loop? Can you walk me through it? |

## Grupa 3
| polski | angielski |
|---|---|
| rozważałeś…? / a może…? | have you considered…? |
| Rozważałeś użycie mapy zamiast listy? | Have you considered using a map instead of a list? |
| A myślałeś o wyciągnięciu tego do funkcji? | Have you considered pulling this into a function? |
| Rozważałeś obsługę pustego przypadku? | Have you considered handling the empty case? |
| skłaniałbym się ku… | I'd lean toward… |
| (sztywno) Moim zdaniem lepsza byłaby inna nazwa. | In my opinion a different name would be better. |
| (luźno) Skłaniałbym się ku jaśniejszej nazwie. | I'd lean toward a clearer name. |
| mogłoby być czyściej, gdyby… | it might be cleaner to… |
| Mogłoby być czyściej, gdybyś rozbił to na dwie funkcje. | It might be cleaner to split this into two functions. |
| jedną z opcji byłoby… | one option would be… |
| Jedną z opcji byłoby zcache'owanie tego wyniku. | One option would be to cache this result. |
| Skłaniałbym się ku rozbiciu tego — byłoby czyściej. A co myślisz o wyciągnięciu walidacji osobno? | I'd lean toward splitting this — it might be cleaner. What do you think about pulling the validation out? |

## Grupa 4
| polski | angielski |
|---|---|
| to się może na nas zemścić, kiedy… | this could bite us when… |
| To się może zemścić, jak ruch wzrośnie. | This could bite us when traffic spikes. |
| To się odbije czkawką przy większych danych. | This could bite us with larger datasets. |
| wstrzymałbym merge, dopóki… | I'd hold off on merging until… |
| (sztywno) Nie powinniśmy tego teraz mergować. | We shouldn't merge this yet. |
| (luźno) Wstrzymałbym merge, dopóki nie dodamy testów. | I'd hold off on merging until we add tests. |
| dla mnie to jest blocker | this is a blocker for me |
| Brak obsługi błędów to dla mnie blocker. | The missing error handling is a blocker for me. |
| delikatnie się postawić (recykling z rozdz. 8) | to push back gently |
| Delikatnie się tu postawię — to jest ryzykowne. | I'll push back gently here — this is risky. |
| chyba powinniśmy… | we should probably… |
| Delikatnie się postawię: brak obsługi błędów to dla mnie blocker — to się może zemścić przy większym ruchu, więc wstrzymałbym merge, dopóki tego nie dodamy. | I'll push back gently here — the missing error handling is a blocker for me; this could bite us when traffic spikes, so I'd hold off on merging until we add it. |

## Grupa 5
| polski | angielski |
|---|---|
| dobrze wypatrzone / dobre oko | good catch |
| Dobre oko, dzięki. | Good catch, thanks. |
| Dobrze wypatrzone, poprawiam. | Good catch, I'll fix it. |
| Racja, dobre oko — przeoczyłem to. | Good catch, I missed that. |
| słuszna uwaga | fair point |
| (sztywno) Zgadzam się z twoją uwagą. | I agree with your comment. |
| (luźno) Słuszna uwaga, masz rację. | Fair point, you're right. |
| zajmę się tym / poprawię | I'll address that |
| Masz rację, zaraz to poprawię. | You're right, let me fix that. |
| Zajmę się tym w kolejnym commicie. | I'll address that in the next commit. |
| dla mnie wygląda dobrze / można mergować | LGTM (looks good to me) |
| Z mojej strony wygląda super — merguj. | LGTM, ship it. |
| Dobre oko — słuszna uwaga, masz rację, zaraz to poprawię; poza tym z mojej strony można wypuszczać. | Good catch — fair point, you're right, let me fix that; other than that, it's good to go. |

## Nowe słowa i struktury
| polski | angielski |
|---|---|
| drobna uwaga / czepialstwo | nit (a minor comment) |
| nie blokuję tym, ale… | not a blocker, but… |
| spokojnie zignoruj | feel free to ignore |
| poza zakresem, ale… | out of scope, but… |
| objaśnisz mi to? (recykling z rozdz. 8) | can you walk me through this? |
| jaki jest powód, że…? | what's the reasoning behind…? |
| może czegoś nie widzę, ale… | I might be missing something, but… |
| pomóż mi zrozumieć… | help me understand… |
| rozważałeś…? | have you considered…? |
| skłaniałbym się ku… | I'd lean toward… |
| mogłoby być czyściej, gdyby… | it might be cleaner to… |
| jedną z opcji byłoby… | one option would be… |
| a co myślisz o…? | what do you think about…? |
| to się może na nas zemścić | this could bite us |
| wstrzymałbym merge, dopóki… | I'd hold off on merging until… |
| dla mnie to jest blocker | this is a blocker for me |
| delikatnie się postawić (recykling z rozdz. 8) | to push back gently |
| chyba powinniśmy… | we should probably… |
| dobre oko | good catch |
| słuszna uwaga | fair point |
| zajmę się tym | I'll address that |
| wygląda dobrze, można mergować | LGTM / good to go |
