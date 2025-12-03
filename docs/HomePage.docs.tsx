import React from "react"
// eslint-disable-next-line no-restricted-imports
import { Doc, Code } from "../macro"

export default (
  <Doc path="/">
    <h1 id="document-code-in-code">
      Document code <em>in</em> code
    </h1>
    <p>Markdown works great for documentation... until it doesn't.</p>
    <p>
      You start off writing simple headings, paragraphs, and tables. Markdown
      does its job perfectly, it's easy to type and easy to read...
    </p>
    <p>
      Then you want to embed some code samples. Great, Markdown can do syntax
      highlighting...
    </p>
    <p>
      Now you'd like a couple of custom components. Maybe some columns here and
      there. Make better use of whitespace. No problem, Markdown lets you embed
      a little HTML. It's manageable...
    </p>
    <p>
      But now you want to run a simple demo in Markdown. So you move over to
      MDX. You start embedding React components in your Markdown. Now things are
      not looking so rosy:
    </p>
    <ul>
      <li>You don't get type checking</li>
      <li>You need a complex documentation builder like Storybook</li>
      <li>
        Now you want to customize the look of your documentation, better start
        overriding styles...
      </li>
    </ul>
    <h2 id="codedocs-is-different">Codedocs is different</h2>
    <p>
      If you're maintaining a codebase, you know how to read code. Is it really
      so much worse?
    </p>
    <h2 id="markdown">In Markdown:</h2>
    <Code
      mode="markdown"
      source={`---
title: React
description: A JavaScript library for building user interfaces
---

# React

A JavaScript library for building user interfaces`}
    />
    <h2 id="codedocs">In Codedocs:</h2>
    <Code
      mode="tsx"
      source={`import { Doc } from 'codedocs'

export default (
	<Doc path="/React">
		<p>A JavaScript library for building user interfaces</p>
	</Doc>
)`}
    />
    <h2 id="benefits">Benefits</h2>
    <ul>
      <li>Codedocs are fully type checked.</li>
      <li>
        For UI libraries, use the same build system you use for your library, no
        special build needed.
      </li>
      <li>
        Embed <em>anything</em>.
      </li>
      <li>
        Use your own design system to style your site. No special theme object,
        just override our components with yours.
      </li>
    </ul>
  </Doc>
)
