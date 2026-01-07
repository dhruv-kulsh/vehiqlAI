// const CarPage =  ({params}) => {
//     const {id} =  params;
//     return <div>CarPage : {id}</div>
// }

// export default CarPage;

export default async function CarPage({ params }) {
  const { id } = await params; // no await

  return <div>CarPage: {id}</div>;
}
