For collecting and sending RxJS data to a google chrome extension.

The transformer takes the AST as input and returns a modified AST to the compilation process.
It replaces RxJS nodes: creation operators, pipe, pipeable operators and subscribe by wrapped versions from the rxjs_wrapper.
During the replacement of nodes the Transformer collects and creates metadata objects and passes it along to the wrapped node.
The rxjs_wrapper sends the given metadata object to a set chrome extension on node execution.
Messages are sent as objects to the chrome extension through the chrome.runtime API.

The communication protocol between the rxjs_wrapper and the chrome extension is
to use sanitized objects adhering the following interface:
