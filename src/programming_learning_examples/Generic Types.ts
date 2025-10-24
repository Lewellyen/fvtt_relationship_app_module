function echo<Type>(value: Type): Type {
  return value;
}

let a = echo(123);
let b = echo("hi");
let c = echo({ name: "Andi" });

console.log(a);
console.log(b);
console.log(c);

a = echo(123);
b = echo("hi");
c = echo({ name: "Andi" });

console.log(a);
console.log(b);
console.log(c);
