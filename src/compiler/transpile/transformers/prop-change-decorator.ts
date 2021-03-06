import { ModuleFile, PropChangeMeta } from '../../../util/interfaces';
import { PROP_CHANGE_METHOD_NAME, PROP_CHANGE_PROP_NAME } from '../../../util/constants';
import * as ts from 'typescript';


export function getPropChangeDecoratorMeta(fileMeta: ModuleFile, classNode: ts.ClassDeclaration) {
  fileMeta.cmpMeta.propsWillChangeMeta = [];
  getPropChangeDecorator(classNode, 'PropWillChange', fileMeta.cmpMeta.propsWillChangeMeta);

  fileMeta.cmpMeta.propsDidChangeMeta = [];
  getPropChangeDecorator(classNode, 'PropDidChange', fileMeta.cmpMeta.propsDidChangeMeta);
}


function getPropChangeDecorator(classNode: ts.ClassDeclaration, decoratorName: string, propChangeMeta: PropChangeMeta[]) {
  const decoratedMembers = classNode.members.filter(n => n.decorators && n.decorators.length);

  decoratedMembers.forEach(memberNode => {
    let isPropChange = false;
    let propName: string = null;
    let methodName: string = null;

    memberNode.forEachChild(n => {

      if (n.kind === ts.SyntaxKind.Decorator && n.getChildCount() > 1 &&
          n.getChildAt(1).getFirstToken().getText() === decoratorName) {

        isPropChange = true;

        n.getChildAt(1).forEachChild(n => {

          if (n.kind === ts.SyntaxKind.StringLiteral && !propName) {
            propName = n.getText();
            propName = propName.replace(/\'/g, '');
            propName = propName.replace(/\"/g, '');
            propName = propName.replace(/\`/g, '');
          }

        });

      } else if (isPropChange) {
        if (n.kind === ts.SyntaxKind.Identifier && !methodName) {
          methodName = n.getText();
        }
      }

    });

    if (isPropChange && propName && methodName) {
      const propChange: any = [];

      propChange[PROP_CHANGE_PROP_NAME] = propName;
      propChange[PROP_CHANGE_METHOD_NAME] = methodName;

      propChangeMeta.push(propChange);

      memberNode.decorators = undefined;
    }
  });

  propChangeMeta = propChangeMeta.sort((a, b) => {
    if (a[PROP_CHANGE_PROP_NAME].toLowerCase() < b[PROP_CHANGE_PROP_NAME].toLowerCase()) return -1;
    if (a[PROP_CHANGE_PROP_NAME].toLowerCase() > b[PROP_CHANGE_PROP_NAME].toLowerCase()) return 1;
    if (a[PROP_CHANGE_METHOD_NAME] < b[PROP_CHANGE_METHOD_NAME]) return -1;
    if (a[PROP_CHANGE_METHOD_NAME] > b[PROP_CHANGE_METHOD_NAME]) return 1;
    return 0;
  });
}
