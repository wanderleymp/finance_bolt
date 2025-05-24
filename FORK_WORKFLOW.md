# Fluxo de Trabalho com Forks no GitHub

Este documento explica como funciona o fluxo de trabalho entre o repositório original e o fork, além do passo a passo para sincronizar branches e enviar/receber alterações entre eles.

---

## Conceito de Fork

- Um fork é uma cópia independente de um repositório no GitHub.
- **Forks NÃO são sincronizados automaticamente** com o repositório original.
- Alterações feitas no original não aparecem no fork automaticamente e vice-versa.
- Para sincronizar, é necessário executar comandos manuais ou abrir Pull Requests.

---

## Fluxo: Atualizando o Fork com Alterações do Repositório Original

1. **Atualize sua branch local**
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Envie (push) a branch main para o fork**
   ```bash
   git push fork main
   ```
   - `fork` é o nome do remoto que aponta para o seu fork (adicione com `git remote add fork <url_do_fork>` caso ainda não tenha).

3. **Verifique no GitHub**
   - Acesse o fork e confira se a branch `main` está atualizada.

4. **(Opcional) Abra um Pull Request**
   - Se quiser propor as mudanças do fork para o original, use o botão "Compare & pull request" no GitHub.

---

## Fluxo: Atualizando o Repositório Original com Alterações do Fork

Se você fez alterações no fork e quer trazê-las para o original:

1. **No GitHub:**
   - Acesse o fork e clique em "Compare & pull request" para abrir um PR do fork para o original.
   - O mantenedor do original revisa e faz merge se desejar.

2. **No terminal (opcional, caso você tenha acesso ao original):**
   - Adicione o fork como remoto, se necessário:
     ```bash
     git remote add fork <url_do_fork>
     ```
   - Busque as alterações do fork:
     ```bash
     git fetch fork
     ```
   - Faça o merge na branch desejada:
     ```bash
     git checkout main
     git merge fork/main
     ```
   - Resolva conflitos, se houver, e faça push para o original:
     ```bash
     git push origin main
     ```

---

## Dicas Importantes

- Sempre confira em qual branch está antes de fazer merges ou push.
- Use nomes claros para os remotos: `origin` (original), `fork` (seu fork).
- O processo é manual para garantir controle sobre o que é sincronizado.
- Pull Requests são o método recomendado para colaboração entre forks e originais.

---

## Resumo Visual

```
[original/main] <---pull--- [fork/main] <---push--- [sua máquina]
    ^                             |
    |---pull request-------------|
```

- **Push**: Envia alterações locais para o repositório remoto (original ou fork).
- **Pull**: Baixa alterações do remoto para sua máquina.
- **Pull Request**: Proposta de alteração entre repositórios/branches no GitHub.

---

Se precisar de exemplos de comandos para algum caso específico, consulte este documento ou peça ajuda ao time!
